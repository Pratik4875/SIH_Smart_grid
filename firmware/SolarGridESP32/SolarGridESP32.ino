/**
 * SolarGridESP32.ino
 * Core ESP32 Firmware for SolarGrid Smart Microgrid Prototype.
 * Developed for Smart India Hackathon (SIH).
 * 
 * Hardware Layout:
 * - Brain: ESP32 DevKit V1
 * - Sensors:
 *   - Solar Voltage Divider: 33k top, 10k bottom (Ratio: 10/43 = 0.2325, Mult: 4.3)
 *   - Battery Voltage Divider: 10k top, 33k bottom (Ratio: 33/43 = 0.7674, Mult: 43/33 = 1.303)
 *   - DHT11 Temperature & Humidity Sensor: Pin 4
 * - Actuators (Loads):
 *   - Pin 26 (P1): Active LOW MOSFET (LOW = ON, HIGH = OFF)
 *   - Pin 25 (P2): Active HIGH Relay (HIGH = ON, LOW = OFF)
 *   - Pin 27 (P3): Active HIGH Relay (HIGH = ON, LOW = OFF)
 */

#include <DHT.h>
#include <Firebase_ESP_Client.h>
#include <WiFi.h>

// Token generation process info and RTDB helper functions
#include <addons/RTDBHelper.h>
#include <addons/TokenHelper.h>

// ==========================================================
// WIFI + FIREBASE CONFIGURATION (Replace with your credentials)
// ==========================================================
#define WIFI_SSID "Pratik.wifi"
#define WIFI_PASSWORD "Pr@tik123"

#define FIREBASE_API_KEY "AIzaSyAsavz-xYJs19mKDCxowNOKmMuYuXOQDLI"
#define FIREBASE_DATABASE_URL "smartpowergridrenuableenergy-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_DATABASE_SECRET "8oZcUeR2cCu0kzK7OwMIcvyuo78P4zvWQUXbda66"

// ==========================================================
// 1. CONFIGURATIONS & CONSTANTS
// ==========================================================
#define SERIAL_BAUD_RATE 115200
#define TELEMETRY_INTERVAL_MS 3000

// Device Identifier
#define DEVICE_ID "ESP32-MG-001"
#define FIRMWARE_VERSION "v1.0.2" // Updated version with correct battery multiplier

// GPIO Pin Mappings for Loads
#define PIN_LOAD_1 26 // MOSFET / Active LOW (LOW = ON, HIGH = OFF)
#define PIN_LOAD_2 25 // Relay 1 / Active HIGH (HIGH = ON, LOW = OFF)
#define PIN_LOAD_3 27 // Relay 2 / Active HIGH (HIGH = ON, LOW = OFF)
#define PIN_DHT11 4   // DHT11 Data Pin
#define USE_DHT_LIBRARY

// GPIO Pin Mappings for Sensors
#define PIN_ADC_SOLAR_VOLTAGE 34
#define PIN_ADC_BATTERY_VOLTAGE 35
#define PIN_CURRENT_SENSOR -1

// ==========================================================
// 2. GLOBAL OBJECTS & STATE
// ==========================================================
struct SensorData {
  float temperature;
  float humidity;
  float solarVoltage;
  float batteryVoltage;
};

// Firebase Data structures
FirebaseData streamFbdo;
FirebaseData rtdbFbdo;
FirebaseData telemetryFbdo; // Global allocation to prevent memory crash
FirebaseAuth auth;
FirebaseConfig config;

// Local Sensor Objects
#ifdef USE_DHT_LIBRARY
static DHT dht(PIN_DHT11, DHT11);
#endif

// State Trackers
unsigned long lastTelemetryTime = 0;
static String lastExecutedCommandId = "";
static bool loadStates[3] = {false, false, false}; // P1, P2, P3 (Internal status: true=ON, false=OFF)

// ==========================================================
// 3. LOAD CONTROL FUNCTIONS
// ==========================================================
void setupControl() {
  // All 3 Load channels are Active LOW (HIGH = OFF at boot, LOW = ON)
  pinMode(PIN_LOAD_1, OUTPUT);
  digitalWrite(PIN_LOAD_1, HIGH); // OFF
  loadStates[0] = false;

  pinMode(PIN_LOAD_2, OUTPUT);
  digitalWrite(PIN_LOAD_2, HIGH); // OFF
  loadStates[1] = false;

  pinMode(PIN_LOAD_3, OUTPUT);
  digitalWrite(PIN_LOAD_3, HIGH); // OFF
  loadStates[2] = false;
}

void setLoadState(int loadIndex, bool state) {
  if (loadIndex < 0 || loadIndex > 2)
    return;
  loadStates[loadIndex] = state;

  // Active LOW logic for all actuators (LOW = ON, HIGH = OFF)
  switch (loadIndex) {
  case 0:
    digitalWrite(PIN_LOAD_1, state ? LOW : HIGH);
    break;
  case 1:
    digitalWrite(PIN_LOAD_2, state ? LOW : HIGH);
    break;
  case 2:
    digitalWrite(PIN_LOAD_3, state ? LOW : HIGH);
    break;
  }
}

const char *getLoadStateString(int loadIndex) {
  if (loadIndex < 0 || loadIndex > 2)
    return "OFF";
  return loadStates[loadIndex] ? "ON" : "OFF";
}

// ==========================================================
// 4. SENSOR & TELEMETRY FUNCTIONS
// ==========================================================
void setupSensors() {
#ifdef USE_DHT_LIBRARY
  dht.begin();
#endif

  if (PIN_ADC_SOLAR_VOLTAGE != -1) {
    pinMode(PIN_ADC_SOLAR_VOLTAGE, INPUT);
  }
  if (PIN_ADC_BATTERY_VOLTAGE != -1) {
    pinMode(PIN_ADC_BATTERY_VOLTAGE, INPUT);
  }
}

int getBatteryPercentage(float voltage) {
  if (voltage <= 0.5)
    return 0;
  
  // Standard 18650 Cell single cell range: 3.2V (0%) to 4.2V (100%)
  float minV = 3.2;
  float maxV = 4.2;
  if (voltage >= maxV)
    return 100;
  if (voltage <= minV)
    return 0;
  return (int)((voltage - minV) / (maxV - minV) * 100);
}

SensorData readSensors() {
  SensorData data;

#ifdef USE_DHT_LIBRARY
  data.temperature = dht.readTemperature();
  data.humidity = dht.readHumidity();
  if (isnan(data.temperature))
    data.temperature = 0.0;
  if (isnan(data.humidity))
    data.humidity = 0.0;
#else
  data.temperature = 27.8;
  data.humidity = 52.0;
#endif

  // Read Solar Voltage (GPIO 34)
  // Voltage divider: 33k top, 10k bottom.
  // Ratio: Vadc = Vsolar * (10 / (33 + 10)) = Vsolar * (10 / 43) = Vsolar * 0.2325
  // Vsolar = Vadc * (43 / 10) = Vadc * 4.3
  if (PIN_ADC_SOLAR_VOLTAGE != -1) {
    int rawSolar = analogRead(PIN_ADC_SOLAR_VOLTAGE);
    float pinV = (rawSolar / 4095.0) * 3.3;
    data.solarVoltage = pinV * 4.3; // Divider multiplier
  } else {
    data.solarVoltage = 0.0;
  }

  // Read Battery Voltage (GPIO 35)
  // Voltage divider: 10k top, 33k bottom.
  // Ratio: Vadc = Vbatt * (33 / (10 + 33)) = Vbatt * (33 / 43) = Vbatt * 0.7674
  // Vbatt = Vadc * (43 / 33) = Vadc * 1.30303
  if (PIN_ADC_BATTERY_VOLTAGE != -1) {
    int rawBattery = analogRead(PIN_ADC_BATTERY_VOLTAGE);
    float pinV = (rawBattery / 4095.0) * 3.3;
    data.batteryVoltage = pinV * (43.0 / 33.0); // FIXED battery multiplier (1.303 instead of 4.3)
  } else {
    data.batteryVoltage = 0.0;
  }

  return data;
}

void publishLocalTelemetry(const SensorData &data) {
  Serial.print(F("{\"deviceId\":\""));
  Serial.print(F(DEVICE_ID));
  Serial.print(F("\",\"firmwareVersion\":\""));
  Serial.print(F(FIRMWARE_VERSION));
  Serial.print(F("\",\"uptimeMs\":"));
  Serial.print(millis());
  Serial.print(F(",\"battery\":{\"voltage\":"));
  Serial.print(data.batteryVoltage);
  Serial.print(F(",\"percentage\":"));
  Serial.print(getBatteryPercentage(data.batteryVoltage));
  Serial.print(F("},\"solar\":{\"voltage\":"));
  Serial.print(data.solarVoltage);
  // Estimate solar power based on 0.6W peak panel capacity (approximate load current)
  float estimatedPower = (data.solarVoltage > 1.5) ? (data.solarVoltage * 0.12) : 0.0;
  if (estimatedPower > 0.6) estimatedPower = 0.6;
  Serial.print(F(",\"estimatedPower\":"));
  Serial.print(estimatedPower);
  Serial.print(F("},\"environment\":{\"temperature\":"));
  Serial.print(data.temperature);
  Serial.print(F(",\"humidity\":"));
  Serial.print(data.humidity);
  Serial.print(F("},\"loads\":["));

  Serial.print(F("{\"id\":\"RLY-001\",\"gpioPin\":26,\"physicalState\":\""));
  Serial.print(getLoadStateString(0));
  Serial.print(F("\"},"));

  Serial.print(F("{\"id\":\"RLY-002\",\"gpioPin\":25,\"physicalState\":\""));
  Serial.print(getLoadStateString(1));
  Serial.print(F("\"},"));

  Serial.print(F("{\"id\":\"RLY-003\",\"gpioPin\":27,\"physicalState\":\""));
  Serial.print(getLoadStateString(2));
  Serial.print(F("\"}"));

  Serial.println(F("]}"));
}

void publishFirebaseTelemetry(const SensorData &data) {
  if (!Firebase.ready())
    return;

  FirebaseJson telemetryJson;
  telemetryJson.set("timestamp", (int)(millis() / 1000));
  telemetryJson.set("deviceId", DEVICE_ID);
  telemetryJson.set("firmwareVersion", FIRMWARE_VERSION);

  // Battery
  FirebaseJson batteryJson;
  batteryJson.set("voltage", data.batteryVoltage);
  batteryJson.set("percentage", getBatteryPercentage(data.batteryVoltage));
  telemetryJson.set("battery", batteryJson);

  // Solar
  FirebaseJson solarJson;
  solarJson.set("voltage", data.solarVoltage);
  float estimatedPower = (data.solarVoltage > 1.5) ? (data.solarVoltage * 0.12) : 0.0;
  if (estimatedPower > 0.6) estimatedPower = 0.6;
  solarJson.set("estimatedPower", estimatedPower);
  telemetryJson.set("solar", solarJson);

  // Environment
  FirebaseJson envJson;
  envJson.set("temperature", data.temperature);
  envJson.set("humidity", data.humidity);
  telemetryJson.set("environment", envJson);

  // Loads Array
  FirebaseJsonArray loadsArray;
  for (int i = 0; i < 3; i++) {
    FirebaseJson loadJson;
    String idStr = "RLY-00" + String(i + 1);
    loadJson.set("id", idStr.c_str());
    loadJson.set("gpioPin",
                 i == 0 ? PIN_LOAD_1 : (i == 1 ? PIN_LOAD_2 : PIN_LOAD_3));
    loadJson.set("physicalState", getLoadStateString(i));
    loadsArray.add(loadJson);
  }
  telemetryJson.set("loads", loadsArray);

  String path = String("/devices/") + DEVICE_ID + "/telemetry";
  
  if (Firebase.RTDB.setJSON(&telemetryFbdo, path.c_str(), &telemetryJson)) {
    Serial.println(F("[FIREBASE_TELEMETRY] Telemetry published successfully."));
  } else {
    Serial.print(F("[FIREBASE_TELEMETRY_ERR] Failed: "));
    Serial.println(telemetryFbdo.errorReason());
  }
}

// ==========================================================
// 5. WI-FI & FIREBASE SETUP FUNCTIONS
// ==========================================================
void connectWiFi() {
  Serial.print(F("[WIFI] Connecting to SSID: "));
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\n[WIFI] Connected successfully!"));
    Serial.print(F("[WIFI] IP Address: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\n[WIFI] Connection timed out. Running offline."));
  }
}

void setupFirebase() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[FIREBASE] Offline. Skipping Firebase initialization."));
    return;
  }

  Serial.println(F("[FIREBASE] Initializing connection parameters..."));

  config.api_key = FIREBASE_API_KEY;
  config.database_url = FIREBASE_DATABASE_URL;
  config.signer.tokens.legacy_token = FIREBASE_DATABASE_SECRET;
  config.token_status_callback = tokenStatusCallback;

  // Sign in using database secret token
  config.signer.test_mode = (strlen(FIREBASE_DATABASE_SECRET) == 0);

  // Inject &auth so the library compiles the state properly
  Firebase.begin(&config, &auth);

  Firebase.reconnectWiFi(true);

  // Setup streaming listener for command updates
  String streamPath = String("/devices/") + DEVICE_ID + "/command";
  if (!Firebase.RTDB.beginStream(&streamFbdo, streamPath.c_str())) {
    Serial.print(F("[FIREBASE_STREAM_ERR] Stream setup failed: "));
    Serial.println(streamFbdo.errorReason());
  } else {
    Serial.println(F("[FIREBASE_STREAM] Stream listening channel active."));
  }
}

void handleRemoteCommand(String commandId, String target, String action) {
  if (commandId == lastExecutedCommandId) {
    return; // Prevent duplicate execution
  }
  lastExecutedCommandId = commandId;

  Serial.print(F("[FIREBASE_CMD] Received: ID="));
  Serial.print(commandId);
  Serial.print(F(" | Target="));
  Serial.print(target);
  Serial.print(F(" | Action="));
  Serial.println(action);

  bool state = (action == "ON");
  int loadIndex = -1;

  if (target == "RLY-001")
    loadIndex = 0;
  else if (target == "RLY-002")
    loadIndex = 1;
  else if (target == "RLY-003")
    loadIndex = 2;

  if (loadIndex != -1) {
    // 1. Actuate physical GPIO
    setLoadState(loadIndex, state);

    // 2. Publish acknowledgement
    FirebaseJson ackJson;
    ackJson.add("commandId", commandId);
    ackJson.add("status", "acknowledged");
    ackJson.add("physicalState", state ? "ON" : "OFF");
    ackJson.add("timestamp", (int)(millis() / 1000));

    String ackPath = String("/devices/") + DEVICE_ID + "/commandAck";
    if (Firebase.RTDB.setJSON(&rtdbFbdo, ackPath.c_str(), &ackJson)) {
      Serial.println(F("[FIREBASE_ACK] Command acknowledged successfully."));
    } else {
      Serial.print(F("[FIREBASE_ACK_ERR] Failed: "));
      Serial.println(rtdbFbdo.errorReason());
    }

    // 3. Force immediate telemetry publish
    SensorData data = readSensors();
    publishFirebaseTelemetry(data);
  } else {
    Serial.println(F("[FIREBASE_CMD_ERR] Invalid target load specified."));
  }
}

// ==========================================================
// 6. MAIN ARDUINO ENTRY POINTS
// ==========================================================
void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  delay(1000);

  Serial.println(F("[SYSTEM] SolarGrid Core Edge Node Initializing..."));

  setupControl();
  setupSensors();
  connectWiFi();
  setupFirebase();

  Serial.println(F("[SYSTEM] Initialization finished. Local Loop Active."));
}

void loop() {
  unsigned long currentTime = millis();

  // 1. Publish Telemetry periodically
  if (currentTime - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = currentTime;
    SensorData data = readSensors();

    publishLocalTelemetry(data);

    if (WiFi.status() == WL_CONNECTED && Firebase.ready()) {
      publishFirebaseTelemetry(data);
    }
  }

  // 2. Listen to Firebase commands
  if (WiFi.status() == WL_CONNECTED && Firebase.ready()) {
    if (Firebase.RTDB.readStream(&streamFbdo)) {
      if (streamFbdo.streamTimeout()) {
        Serial.println(F("[FIREBASE_STREAM] Stream timeout, resuming..."));
      } else if (streamFbdo.streamAvailable()) {
        if (streamFbdo.dataType() == "json") {
          FirebaseJson *json = streamFbdo.to<FirebaseJson *>();
          FirebaseJsonData result;

          String commandId = "";
          String target = "";
          String action = "";

          json->get(result, "commandId");
          if (result.success)
            commandId = result.to<String>();

          json->get(result, "target");
          if (result.success)
            target = result.to<String>();

          json->get(result, "action");
          if (result.success)
            action = result.to<String>();

          if (commandId != "" && target != "" && action != "") {
            handleRemoteCommand(commandId, target, action);
          }
        }
      }
    }
  }

  // 3. Fallback Serial override parser
  if (Serial.available() > 0) {
    String commandInput = Serial.readStringUntil('\n');
    commandInput.trim();

    if (commandInput.startsWith("CMD:")) {
      int firstColon = commandInput.indexOf(':', 4);
      if (firstColon != -1) {
        String targetLoad = commandInput.substring(4, firstColon);
        String actionState = commandInput.substring(firstColon + 1);

        bool state = (actionState == "ON");
        int loadIndex = -1;

        if (targetLoad == "RLY-001")
          loadIndex = 0;
        else if (targetLoad == "RLY-002")
          loadIndex = 1;
        else if (targetLoad == "RLY-003")
          loadIndex = 2;

        if (loadIndex != -1) {
          setLoadState(loadIndex, state);
          Serial.print(F("[COMMAND_ACK] Success driving "));
          Serial.print(targetLoad);
          Serial.print(F(" to pin state: "));
          Serial.println(state ? F("ON") : F("OFF"));
        } else {
          Serial.println(F("[COMMAND_ERR] Target Load ID unknown."));
        }
      } else {
        Serial.println(F("[COMMAND_ERR] Invalid command syntax."));
      }
    }
  }

  delay(10);
}
