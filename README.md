# Capitol Arrivals

An independently developed **native iPhone transit tracker** for Washington, DC, built using Expo SDK 58, React Native, TypeScript, and WMATA's official developer feeds.

**First version includes:**

- Live train predictions, including both platforms at interchange stations
- Live bus predictions at individual Metrobus stops
- Search by Metro station name, stop name, exact bus stop ID, or bus route
- Nearby Metro stations and bus stops with distances, requested only when the user taps Find Stops
- Favorites stored only on the phone using SQLite
- Automatic refresh every 30 seconds on the arrival detail screen; manual refresh and useful no-data/error states
- Original design and branding, separate from WMATA and Dixon Mobility

This is a **working source project**, not yet a signed `.ipa` or App Store/TestFlight listing. Running it on a real iPhone requires Apple signing and an Expo development build (instructions below). The UI was not device-tested in this workspace, but the TypeScript, lint, backend tests, and Expo bundles are checked.

## 1. Install dependencies

You need Node.js 22 or newer. From this folder:

```bash
npm install
npm run test
npm run typecheck
npm run lint
```

## 2. Start the transit-data backend

In one terminal:

```bash
npm run server
```

This starts a local server on port `8787`. You can test it by visiting:

- `http://localhost:8787/api/health`
- `http://localhost:8787/api/arrivals?kind=rail&id=A03` (Dupont Circle)
- `http://localhost:8787/api/search?q=Metro`

For limited development only, the server uses the **public demo key** that WMATA publishes on its developer portal. This key is rate-limited and **must not be used for production**. Before publishing, register a free personal developer key at <https://developer.wmata.com/> and set it in the server environment:

```bash
WMATA_API_KEY=YOUR_OWN_KEY npm run server
```

The key stays in the server environment; it is never embedded in the iPhone app. Do not put it in `EXPO_PUBLIC_` variables or commit it.

## 3. Connect your iPhone to the backend

Your iPhone cannot reach a server through your computer's `localhost` address. Connect your computer and phone to the same Wi-Fi network and determine your computer's LAN address (e.g. `192.168.1.25`).

Create `.env.local` (using `.env.example` as a guide):

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.25:8787
```

The app also attempts to infer the local server host from Expo's development-server address if this variable is not set. Explicit configuration is more reliable.

For TestFlight/App Store builds, replace the local address with a **public HTTPS** URL for a hosted version of `server/index.mjs`. Set `WMATA_API_KEY` securely on that server. The sample backend uses in-memory caching and basic throttling; before a substantial public launch, add hosting monitoring, abuse controls, and review WMATA's data terms.

## 4. Build and install on an actual iPhone

Expo SDK 58 is current as of this project, but the App Store build of Expo Go may not support it. Use an Expo **development build** rather than relying on Expo Go.

You can create a signed development build from Windows/Linux/macOS using Expo's cloud build service:

1. Have an Expo account and an Apple Developer Program membership. Sign in when prompted.
2. From this folder, run:

   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build --platform ios --profile development
   ```

3. Follow the prompts to register your iPhone for an internal development build and install the resulting build.
4. Start the app's JavaScript development server:

   ```bash
   npx expo start --dev-client
   ```

5. Open Capitol Arrivals on your iPhone, connect to your local development session, and verify predictions on a station you recognize.

If you use a Mac with Xcode, `npx expo run:ios --device` is an alternative for installing on a physical iPhone without a paid Apple Developer Program membership. A paid Apple Developer Program membership is needed for App Store distribution.

The provisional iOS bundle ID is `com.erinuc.capitalarrivals`; change it in `app.json` if you'd like another identifier. The build has **not** been submitted or deployed.

## 5. Prepare for public release

1. Host the backend at an HTTPS URL and configure a production WMATA API key.
2. Set `EXPO_PUBLIC_API_BASE_URL` for the Expo production build to that HTTPS URL (Expo environment variable or build environment).
3. Add an appropriate privacy policy, verify accessibility on physical devices, and test current Metrobus routes after WMATA schedule changes.
4. Follow Apple App Review and WMATA branding/data terms. This app must not imply affiliation with either WMATA or the existing Dixon Mobility app.
5. After testing, run `npx eas-cli@latest build --platform ios --profile production` and complete TestFlight/App Store submission in your own developer accounts.

## Project structure

```text
src/app/                  Expo Router screens (Home, Search, Nearby, Saved, Arrivals)
src/components/           Transit cards, arrival rows, buttons, layouts
src/state/                On-device favorites storage
src/lib/                  Typed API client and navigation
server/index.mjs          App-specific API backend, validation, caching
server/normalize.mjs      WMATA response normalization and search
server/normalize.test.mjs Test suite including mocked end-to-end backend tests
assets/icon-source.svg    Original app icon source
eas.json                  iPhone development and production build profiles
```

## API endpoints used

- `Rail.svc/json/jStations`
- `Bus.svc/json/jStops`
- `StationPrediction.svc/json/GetPrediction/{StationCodes}`
- `NextBusService.svc/json/jPredictions?StopID={StopID}`

Rail arrival predictions use WMATA's `ARR`, `BRD`, numeric-minute, and unavailable states without inventing estimates. Service availability is controlled by WMATA. See [developer terms](https://developer.wmata.com/license).

**Not yet included:** ART/Arlington Transit, maps, directions/route planning, push notifications, transit fares, and SmarTrip account features. Those are later stages; the first milestone is dependable live arrivals and favorites.

## Privacy

Favorites live only on the device. Nearby access asks permission after tapping the Find Stops button. The app sends coordinates to its own backend solely to request nearby transit stops and does not store location histories. No account, analytics, or advertising SDK is included.
