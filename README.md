# Weathernext
## Overview
Weathernext is a modern, responsive web application designed to deliver real-time and forecast weather information. It provides users with a clean, intuitive interface to access current conditions, hourly breakdowns, and multi-day forecasts for any location worldwide. Built with a focus on performance and user experience, Weathernext leverages external APIs to ensure accurate and timely data delivery.

## Business Problem
In today's fast-paced environment, access to reliable and detailed weather information is critical for effective planning and safety. Many existing weather solutions present users with cluttered interfaces, intrusive advertisements, or inconsistent data. Weathernext addresses several key challenges:

*   **Fragmented Information**: Users often resort to multiple sources to gather comprehensive weather insights.
*   **Suboptimal User Experience**: Numerous weather applications suffer from slow load times and non-responsive designs, failing to meet modern web standards.
*   **Lack of Granularity**: General forecasts often lack the detailed hourly or daily breakdowns required for precise decision-making.
*   **Accessibility Issues**: Some platforms are not optimized for cross-device compatibility or lack essential features like robust location search and favorite spot management.

Weathernext consolidates these disparate needs into a single, user-friendly, and highly responsive platform, ensuring users are always well-informed.

## Key Capabilities
*   **Current Weather Conditions**: Displays real-time data including temperature (actual and "feels like"), humidity, wind speed and direction, atmospheric pressure, and a general weather description.
*   **Hourly Forecast**: Offers a detailed 24-48 hour outlook, covering temperature fluctuations, precipitation probability, and wind gusts.
*   **Daily / Extended Forecast**: Provides a clear 5-7 day forecast with high/low temperatures, weather icons, and summary descriptions.
*   **Location Search**: Enables users to search for weather information using city names, zip codes, or geographical coordinates.
*   **Favorite Locations Management**: Allows users to save frequently accessed locations for quick retrieval of their weather details.
*   **Responsive User Interface**: Ensures a seamless experience across various devices, from desktop browsers to mobile phones.
*   **Unit Conversion**: Supports toggling between Celsius and Fahrenheit for temperature, and various units for wind speed (e.g., km/h, mph).
*   **Modern Design**: Features a clean and aesthetically pleasing interface, leveraging Tailwind CSS for rapid and customizable UI development.

## Architecture
Weathernext employs a modern full-stack architecture built primarily on Next.js, leveraging its capabilities for both frontend rendering and backend API routes. The data flow is as follows:

1.  **User Interaction**: A user interacts with the application through their web browser or device, viewing weather data, searching for locations, and managing favorites. The frontend is rendered in the browser.
2.  **Next.js Frontend**: This layer, built with React and TypeScript, manages the user interface, handles client-side routing, and initiates calls to the application's API routes for data fetching. Next.js optimizes performance through server-side rendering or static site generation.
3.  **Next.js API Routes**: These are serverless functions within the Next.js application that act as a secure intermediary between the frontend and external weather services. They are crucial for:
    *   **Security**: Protecting sensitive API keys from being exposed on the client-side.
    *   **Flexibility**: Enabling custom backend logic, data transformation, or caching.
    *   **Performance**: Offloading data fetching and processing from the client's device.
4.  **External Weather API**: The Next.js API routes fetch comprehensive raw weather data from a third-party service, such as OpenWeatherMap.

This architecture ensures a fast, secure, and maintainable application by effectively separating UI concerns from data fetching and processing logic.

## Tech Stack
*   **Frontend Framework**: [Next.js](https://nextjs.org/) (React)
    *   *Rationale:* Facilitates server-side rendering (SSR) or static site generation (SSG) for enhanced performance and SEO, provides integrated API routes for backend logic, and offers an excellent developer experience.
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
    *   *Rationale:* Improves code quality, maintainability, and enables early error detection through static type checking.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
    *   *Rationale:* A utility-first CSS framework that accelerates UI development and allows for highly customizable designs.
*   **API Integration**: [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) (natively available in browsers and Node.js)
*   **Weather API**: [OpenWeatherMap API](https://openweathermap.org/api)
    *   *Rationale:* A widely recognized and reliable API offering extensive weather data, including current, hourly, and daily forecasts.
*   **Version Control**: [Git](https://git-scm.com/)
*   **Package Manager**: [Node.js](https://nodejs.org/) / [npm](https://www.npmjs.com/) (also compatible with Yarn/pnpm)
*   **Containerization**: [Docker](https://www.docker.com/)
*   **Cloud Platform**: [Google Cloud Platform (GCP)](https://cloud.google.com/)

## Repository Structure
The project follows a standard Next.js directory structure, complemented by configuration files and documentation for development and deployment.

```
.
├── app/                      # Main Next.js application pages, routes, and layout
├── components/               # Reusable React UI components
├── lib/                      # Utility functions, API helpers, and shared logic
├── store/                    # State management (e.g., using Zustand for global state)
├── types/                    # TypeScript custom type definitions and interfaces
├── .dockerignore             # Specifies files to ignore when building Docker images
├── .env.gcp.example          # Example environment variables for GCP deployment
├── .env.urls                 # Environment variable configurations for URLs
├── .gitignore                # Specifies intentionally untracked files to ignore
├── Dockerfile                # Defines the Docker image for containerization
├── LOCAL_TEST_GUIDE.md       # Documentation for local testing procedures
├── NCM_TRACKING.md           # Tracking documentation (specific to project needs)
├── QUICK_START_LOCAL.md      # Quick start guide for local development
├── README.md                 # Project overview and setup instructions
├── URL_STRATEGY.md           # Documentation describing URL strategies
├── cloudbuild.yaml           # Configuration file for Google Cloud Build CI/CD
├── next.config.js            # Next.js configuration file
├── package-lock.json         # Records the exact versions of dependencies
├── package.json              # Project metadata and script definitions
├── postcss.config.js         # PostCSS configuration, typically for Tailwind CSS
├── start_weather.sh          # Shell script to start the weather application
├── tailwind.config.js        # Tailwind CSS configuration file
└── tsconfig.json             # TypeScript compiler configuration
```

## Local Setup
To get Weathernext up and running on your local machine, follow these steps:

### Prerequisites
*   Node.js (LTS version recommended)
*   npm or Yarn package manager
*   Git
*   (Optional) Docker for containerized development/testing

### Installation Steps
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/ramamurthy-540835/weathernext.git
    cd weathernext
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    # or yarn install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file in the root of the project based on `.env.gcp.example` or similar existing `.env` files.
    You will need to obtain an API key from OpenWeatherMap (or the chosen weather API provider) and add it:
    ```
    NEXT_PUBLIC_WEATHER_API_KEY=your_openweathermap_api_key_here
    ```

4.  **Run the Development Server**:
    ```bash
    npm run dev
    # or yarn dev
    ```
    The application will start in development mode, typically accessible at `http://localhost:3000`.

## Deployment
Weathernext is designed for deployment on Google Cloud Platform (GCP), leveraging Docker for containerization and Google Cloud Build for CI/CD.

### Prerequisites
*   Google Cloud Platform account and project configured.
*   Google Cloud SDK installed and authenticated.
*   Docker installed (if building images locally).

### Deployment Steps (Example for Google Cloud Run)
1.  **Authenticate GCP CLI**:
    ```bash
    gcloud auth login
    gcloud config set project your-gcp-project-id
    ```

2.  **Environment Variables**:
    Ensure your production environment variables (e.g., `NEXT_PUBLIC_WEATHER_API_KEY`) are securely configured in your chosen GCP service (e.g., Cloud Run environment variables, Secret Manager). The `.env.gcp.example` provides a template.

3.  **Build and Deploy using Cloud Build**:
    The `cloudbuild.yaml` file defines the CI/CD pipeline for building the Docker image and deploying it.
    Trigger a build using `gcloud builds submit`:
    ```bash
    gcloud builds submit --tag gcr.io/your-gcp-project-id/weathernext
    ```
    Once the image is built, you can deploy it to Cloud Run:
    ```bash
    gcloud run deploy weathernext \
      --image gcr.io/your-gcp-project-id/weathernext \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars NEXT_PUBLIC_WEATHER_API_KEY=your_prod_api_key
    ```
    (Adjust region, service name, and environment variables as necessary for your setup.)

4.  **Verify Deployment**:
    After deployment, Cloud Run will provide a URL to access your live Weathernext application.

## Demo Workflow
This section outlines a typical user interaction with the Weathernext application.

1.  **Access Application**: Open the Weathernext web application in your browser. You will typically see current weather for a default or detected location.
2.  **Search for a Location**: Use the prominent search bar to find weather for any city, zip code, or geographical coordinates worldwide. Type in "London" or "90210" and press Enter/Search.
3.  **View Current Conditions**: Upon successful search, the main display will update to show real-time weather data for the selected location, including temperature, "feels like" temperature, humidity, wind, and a general description.
4.  **Explore Forecasts**:
    *   Navigate to the "Hourly Forecast" section (if available on the UI) to see temperature and precipitation probability breakdowns for the next 24-48 hours.
    *   Switch to the "Daily Forecast" or "Extended Forecast" to view high/low temperatures and summary conditions for the next 5-7 days.
5.  **Manage Favorites**: Click a "Favorite" or "Star" icon next to a location to save it. Access your saved locations from a dedicated section (e.g., a dropdown or sidebar) for quick retrieval.
6.  **Toggle Units**: Locate the unit conversion toggle (e.g., "C/F" or "km/h / mph") to switch between metric and imperial units for temperature and wind speed.
7.  **Explore Multiple Locations**: Repeat steps 2-5 to easily compare weather across different cities or regions.

## Future Enhancements
*   **User Authentication and Personalization**: Allow users to create accounts, persist favorite locations across devices, and customize settings.
*   **Advanced Weather Alerts**: Implement real-time notifications for severe weather warnings in saved locations.
*   **Interactive Weather Map**: Integrate a dynamic map displaying weather patterns, radar, and temperature overlays.
*   **Multi-language Support**: Provide localization for the user interface to cater to a global audience.
*   **Data Caching Optimizations**: Implement server-side caching strategies to reduce API calls and improve load times.
*   **UI Themes**: Offer different visual themes (e.g., light/dark mode) for user preference.
*   **Historical Weather Data**: Integrate a feature to view past weather conditions for specific dates.
*   **Browser Widgets/Extensions**: Develop companion browser extensions or home screen widgets for quick weather access.