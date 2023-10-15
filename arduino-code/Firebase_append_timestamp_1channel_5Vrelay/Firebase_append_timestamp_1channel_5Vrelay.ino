#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
// #include <Firebase_ESP_Client.h>
#include <DHT.h>

// Provide the token generation process info.
#include <addons/TokenHelper.h>

// Provide the RTDB payload printing info and other helper functions.
#include <addons/RTDBHelper.h>

// #define DATABASE_URL "https://smart-camera-dry-box-default-rtdb.asia-southeast1.firebasedatabase.app/"
// #define API_KEY "AIzaSyDO8pRd9KRElbs7AIVgHlR-1GS7mMt2Clc"
#define DATABASE_URL "https://smart-dry-box-default-rtdb.firebaseio.com/"
#define API_KEY "AIzaSyDDI0lCBWdyd-GANBOkLdYOkDxpvpFOQUw"
#define WIFI_SSID "Ouyang123-2.4G"
#define WIFI_PASSWORD "0988088011"


#define DHTPIN D1

#define DHTTYPE DHT11  // DHT 11
// #define DHTTYPE DHT22  // DHT 22, AM2302, AM2321

DHT dht(DHTPIN, DHTTYPE);
#define PIN_RELAY D2  // the Arduino pin, which connects to the IN1 pin of relay module


//Define Firebase Data object
FirebaseData fbdo;

FirebaseAuth auth;
FirebaseConfig config;

bool taskCompleted = false;
// FirebaseData firebaseData;

unsigned long sendDataPrevMillis = 0;
int count = 0;
bool signupOK = false;
unsigned long sendDataSndMillis = 0;

void setup() {
  Serial.begin(115200);

  pinMode(DHTPIN, INPUT);
  dht.begin();

  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, LOW);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();
  /* Assign the api key (required) */
  config.api_key = API_KEY;

  /* Assign the RTDB URL (required) */
  config.database_url = DATABASE_URL;

  /* Sign up */
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Connected to Firebase Successfully");
    signupOK = true;
  } else {
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }

  /* Assign the callback function for the long running token generation task */
  // config.token_status_callback = tokenStatusCallback;  //see addons/TokenHelper.h

  Firebase.reconnectWiFi(true);

  /* Assign the callback function for the long running token generation task */
  config.token_status_callback = tokenStatusCallback;  // see addons/TokenHelper.h

  // Since v4.4.x, BearSSL engine was used, the SSL buffer need to be set.
  // Large data transmission may require larger RX buffer, otherwise connection issue or data read time out can be occurred.
  fbdo.setBSSLBufferSize(4096 /* Rx buffer size in bytes from 512 - 16384 */, 1024 /* Tx buffer size in bytes from 512 - 16384 */);

  Firebase.begin(&config, &auth);
  Serial.println();
  delay(1000);
}


void loop() {

  float hum = dht.readHumidity();
  float temp = dht.readTemperature();

  if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > 1000 || sendDataPrevMillis == 0)) {
    //since we want the data to be updated every second
    sendDataPrevMillis = millis();

    Firebase.setInt(fbdo, "/FirebaseIOT/humidity", hum);
    Firebase.setInt(fbdo, "/FirebaseIOT/temperature", temp);

    // String relaystatus = Firebase.getString(fbdo, F("/Firebase/relaystatus"));
    // Serial.printf("Get string Relay %s\n", Firebase.getString(fbdo, F("/FirebaseIOT/relay")) ? fbdo.to<const char *>() : fbdo.errorReason().c_str());

    if (Firebase.getString(fbdo, F("/FirebaseIOT/relay"))) {  // On successful Read operation, function returns 1
      // Serial.println("Data type..: ", fbdo.dataType());
      String val = fbdo.to<const char *>();
      // Serial.println(val);
      // Serial.println("\n Change value at firebase console to see changes here.");
      if (val == "1") {
        digitalWrite(PIN_RELAY, HIGH);
        Serial.println("relay on");
        Serial.println();
      } else if (val == "0") {
        digitalWrite(PIN_RELAY, LOW);
        Serial.println("relay off");
        Serial.println();
      }
    } else {
      Serial.println(fbdo.errorReason());
    }

    // String relaySTA=Firebase.getString(fbdo, F("/FirebaseIOT/relay"));
    // if (fbdo.httpCode() == FIREBASE_ERROR_HTTP_CODE_OK) {
    // printf("RELAY: %lld\n", fbdo.to<const char *>());
    // }
    delay(1000);
  }

  if (millis() > sendDataSndMillis) {

    sendDataSndMillis = millis() + 60000;  // Upload Every mins!

    Serial.printf("Set timestamp... %s\n", Firebase.setTimestamp(fbdo, "/FirebaseIOT/timestamp") ? "ok" : fbdo.errorReason().c_str());

    Serial.printf("Get timestamp... %s\n", Firebase.getDouble(fbdo, "/FirebaseIOT/timestamp") ? "ok" : fbdo.errorReason().c_str());
    if (fbdo.httpCode() == FIREBASE_ERROR_HTTP_CODE_OK)
      printf("TIMESTAMP: %lld\n", fbdo.to<uint64_t>());
    // To set and push data with timestamp, requires the JSON data with .sv placeholder
    FirebaseJson json;

    json.set("Hum", String(hum));
    json.set("Temp", String(temp));
    // now we will set the timestamp value at Ts
    json.set("Timestamp/.sv", "timestamp");  // .sv is the required place holder for sever value which currently supports only string "timestamp" as a value

    // Push data with timestamp
    Serial.printf("Push data with timestamp... %s\n", Firebase.pushJSON(fbdo, "/DHT11", json) ? "ok" : fbdo.errorReason().c_str());
    delay(1000);
  }
}