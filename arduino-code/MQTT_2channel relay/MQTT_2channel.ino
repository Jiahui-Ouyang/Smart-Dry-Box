#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"

#define DHTPIN D1
#define DHTTYPE DHT11
#define PIN_RELAY_1 D2
// #define PIN_RELAY_2 D6

const char* ssid = "Ouyang123-2.4G";
const char* password = "0988088011";
const char* mqtt_server = "broker.netpie.io";
const int mqtt_port = 1883;
const char* mqtt_Client = "b5e48c97-47cb-40bf-a297-138ba674e42b";
const char* mqtt_username = "DzXWGRyto8SmEhXfKja9u8qMuMV5nz6Q";
const char* mqtt_password = "wJ9MSSG)XtKXhW$Y6tlNrjDgmSaBtRCS";

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);

char msg[100];
long lastMsg = 0;
int value = 0;
float humidity = 0.0;
float temperature = 0.0;

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection…");
    if (client.connect(mqtt_Client, mqtt_username, mqtt_password)) {
      Serial.println("connected");
      client.subscribe("@msg/manual");
      client.subscribe("@msg/relay");
      client.subscribe("@msg/auto/#");
      // client.subscribe("@shadow/data/updated");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println("try connecting to NETPIE again in 5 seconds");
      delay(5000);
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  String message;
  for (int i = 0; i < length; i++) {
    message = message + (char)payload[i];
  }
  Serial.println(message);

  if (String(topic) == "@msg/auto/mode") {
    if (message == "on") {
      client.publish("@shadow/data/update", "{\"data\" : {\"auto\" : \"on\"}}");
      Serial.println("Auto mode ON");
    } else if (message == "off") {
      client.publish("@shadow/data/update", "{\"data\" : {\"auto\" : \"off\"}}");
      Serial.println("Auto mode OFF");
    }
  }

  if (String(topic) == "@msg/manual") {
    if (message == "on") {
      digitalWrite(PIN_RELAY_1, LOW);
      // digitalWrite(PIN_RELAY_2, LOW);
      client.publish("@shadow/data/update", "{\"data\" : {\"manual\" : \"on\"}}");
      Serial.println("Manually ON");
    } else if (message == "off") {
      digitalWrite(PIN_RELAY_1, HIGH);
      // digitalWrite(PIN_RELAY_2, HIGH);
      client.publish("@shadow/data/update", "{\"data\" : {\"manual\" : \"off\"}}");
      Serial.println("Manually OFF");
    }
  }

  if (String(topic) == "@msg/relay") {
    if (message == "on") {
      digitalWrite(PIN_RELAY_1, LOW);
      // digitalWrite(PIN_RELAY_2, LOW);
      client.publish("@shadow/data/update", "{\"data\" : {\"relay\" : \"on\"}}");
      Serial.println("Relay ON");
    } else if (message == "off") {
      digitalWrite(PIN_RELAY_1, HIGH);
      // digitalWrite(PIN_RELAY_2, HIGH);
      client.publish("@shadow/data/update", "{\"data\" : {\"relay\" : \"off\"}}");
      Serial.println("Relay OFF");
    }
  }

  if (String(topic) == "@msg/auto/RHset") {
    int RHsetting = message.toInt();
    String data2 = "{\"data\": {\"RHset\":" + String(message) + "}}";
    data2.toCharArray(msg, (data2.length() + 1));
    client.publish("@shadow/data/update", msg);
    // if (RHsetting < humidity) {
    //   Serial.println("Turning on now");
    // }
    Serial.println("RH SET IS: " + message);
  }
}


void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY_1, OUTPUT);
  // pinMode(PIN_RELAY_2, OUTPUT);
  digitalWrite(PIN_RELAY_1, HIGH);  // Set relay "off"
  // digitalWrite(PIN_RELAY_2, HIGH);  // Set relay "off"
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  dht.begin();
}


void loop() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 20000) {
    lastMsg = now;
    ++value;
    String data = "{\"data\": {\"humidity\":" + String(humidity) + ", \"temperature\":" + String(temperature) + "}}";
    Serial.println(data);
    data.toCharArray(msg, (data.length() + 1));
    client.publish("@shadow/data/update", msg);
  }
  delay(1);
}
