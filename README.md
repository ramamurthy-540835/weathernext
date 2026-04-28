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

Weathernext employs a modern full-stack architecture built primarily on Next.js, leveraging its capabilities for both frontend rendering and backend API routes.

```
+---------------------+      HTTP Request      +---------------------------------+
| User Browser/Device | ---------------------> | Weathernext Next.js Frontend    |
+---------------------+                        +---------------------------------+
                                                                |
                                             API Request (e.g., /api/weather)
                                                                |
                                          +-------------------------------------+
                                          | Weathernext Next.js API Routes      |
                                          | (Serverless Functions)              |
                                          +-------------------------------------+
                                                                |
                                                      Fetch Data (API Key Secured)
                                                                |
                                                  +-----------------------------+
                                                  | External Weather API        |
                                                  | (e.g., OpenWeatherMap)      |
                                                  +-----------------------------+
```

1.  **Client-Side (User Browser/Device)**: The user interacts with the application, viewing weather data, searching for locations, and managing favorites. The frontend is rendered in the browser.
2.  **Next.js Frontend**: This layer, built with React and TypeScript, manages the user interface, handles client-side routing, and initiates calls to the application's API routes. Next.js optimizes performance through server-side rendering or static site generation.
3.  **Next.js API Routes**: These are serverless functions within the Next.js application that serve as a secure intermediary between the frontend and external weather services. They are crucial for:
    *   **Security**: Protecting sensitive API keys from being exposed on the client-side.
    *   **Flexibility**: Enabling custom backend logic, data transformation, or caching.
    *   **Performance**: Offloading data fetching and processing from the client's device.
4.  **External Weather API (OpenWeatherMap)**: A third-party service that provides comprehensive raw weather data.

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
*   **Package Manager**: [Node.js](https://nodejs.org/)/[npm](https://www.npmjs.com/) (also compatible with Yarn/pnpm)
*   **Containerization**: [Docker](https://www.docker.com/)
*   **Cloud Platform**: [Google Cloud Platform (GCP)](https://cloud.google.com/)

## Repository Structure

The project follows a standard Next.js directory structure, complemented by configuration files and documentation for development and deployment.

```
.
├── app/                      # Main Next.js application pages and routing handlers
├── components/               # Reusable React UI components
├── lib/                      # Utility functions, API helpers, and shared logic
├── store/                    # State management (e.g., Zustand, Redux if used)
├── types/                    # TypeScript custom type definitions
├── .dockerignore             # Specifies files to ignore when building Docker images
├── .env.gcp.example          # Example environment variables for GCP deployment
├── .env.urls                 # Environment variable configurations for URLs
├── .gitignore                # Specifies intentionally untracked files to ignore
├── Dockerfile                # Defines the Docker image for containerization
├── LOCAL_TEST_GUIDE.md       # Documentation for local testing procedures
├── NCM_TRACKING.md           # (Specific tracking documentation)
├── QUICK_START_LOCAL.md      # Quick start guide for local development
├── README.md                 # Project overview and setup instructions (this file)
├── URL_STRATEGY.md           # Documentation on URL structuring
├── cloudbuild.yaml           # CI/CD configuration for Google Cloud Build
├── next.config.js            # Next.js configuration file
├── package.json              # Project dependencies and scripts
├── postcss.config.js         # PostCSS configuration for styling
├── start_weather.sh          # Script to start the application (potentially for local dev/container)
├── tailwind.config.js        # Tailwind CSS configuration file
└── tsconfig.json             # TypeScript compiler configuration
```

## Local Setup

To get Weathernext running on your local machine, follow these steps:

### Prerequisites

*   **Node.js**: Version 18.x or higher.
    *   Verify installation: `node -v`
*   **npm** (Node Package Manager), **Yarn**, or **pnpm**: A package manager for JavaScript.
    *   Verify installation: `npm -v` (or `yarn -v` / `pnpm -v`)
*   **Git**: For cloning the repository.
    *   Verify installation: `git --version`
*   **OpenWeatherMap API Key**: Obtain a free API key by signing up at [OpenWeatherMap](https://openweathermap.org/api).

### Installation Steps

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/ramamurthy-540835/weathernext.git
    cd weathernext
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    # OR
    yarn install
    # OR
    pnpm install
    ```

3.  **Configure Environment Variables**:
    Create a file named `.env.local` in the root of the project directory. Populate it with your OpenWeatherMap API key and the local API base URL:
    ```ini
    # .env.local
    OPENWEATHER_API_KEY=your_openweathermap_api_key_here
    NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
    ```
    Replace `your_openweathermap_api_key_here` with the actual API key obtained from OpenWeatherMap.

4.  **Run the Development Server**:
    ```bash
    npm run dev
    # OR
    yarn dev
    # OR
    pnpm dev
    ```
    The application will typically be accessible at `http://localhost:3000`.

## Deployment

Weathernext is designed for containerized deployment, leveraging Google Cloud Platform (GCP) for continuous integration and delivery.

1.  **Containerization**: The `Dockerfile` provides instructions to build a Docker image of the application. This ensures a consistent environment across development, testing, and production.
2.  **Google Cloud Build (CI/CD)**: The `cloudbuild.yaml` configuration defines the automated build and deployment pipeline. Upon code pushes to the designated repository branches, Cloud Build triggers:
    *   Building the Docker image of the Weathernext application.
    *   Pushing the built image to a container registry (e.g., Google Container Registry or Artifact Registry).
    *   Deploying the containerized application to a GCP service, typically a serverless platform like [Google Cloud Run](https://cloud.google.com/run) for scalable and cost-effective hosting of Next.js applications with API routes.
3.  **Environment Configuration**: Environment-specific variables, such as API keys and URLs, are managed securely within the GCP deployment environment and referenced by the application during runtime.

This setup ensures reliable, automated, and scalable deployment of the Weathernext application.

## Demo Workflow

Follow these steps to explore the core functionalities of the Weathernext application:

1.  **Access the Application**: Open your web browser and navigate to the deployed Weathernext application (or `http://localhost:3000` if running locally).
2.  **Initial View**: The application will display current weather conditions for a default location (e.g., your current location if permitted, or a predefined city).
3.  **Search for a City**:
    *   Locate the "Search" input field, usually prominent on the page.
    *   Type a city name, for instance, `Tokyo`.
    *   Press `Enter` or click the "Search" button.
    *   The application will update to show the current weather, hourly forecast, and daily forecast for Tokyo.
4.  **Explore Forecasts**:
    *   Scroll down to review the "Hourly Forecast" section, which details weather conditions, temperature changes, and precipitation probability over the next 24-48 hours.
    *   Continue scrolling to view the "Daily Forecast" section, providing a summary for the upcoming 5-7 days.
5.  **Add to Favorites**:
    *   If you wish to quickly revisit `Tokyo`'s weather, find the "Add to Favorites" or "Save Location" button (often represented by a star icon) near the city name.
    *   Click it to add Tokyo to your saved locations.
6.  **Switch to a Favorite**:
    *   Navigate to the "Favorites" section (which might be a dedicated menu item or a list on the homepage).
    *   Click on `Tokyo` from your list to instantly view its weather details without re-typing the search query.
7.  **Change Units (Optional)**:
    *   Look for a settings icon or a toggle switch (e.g., `°C / °F`).
    *   Click to switch between Celsius and Fahrenheit for temperature readings, or other units for wind speed.

This workflow highlights the ease with which users can find, explore, and manage weather information for various locations.

## Future Enhancements

*   **User Authentication and Personalization**: Implement user accounts to allow for persistent favorite locations, custom unit preferences, and personalized weather alerts.
*   **Advanced Weather Data Visualization**: Integrate interactive weather maps showing precipitation, wind patterns, or temperature overlays.
*   **Push Notifications/Alerts**: Develop a system for sending severe weather alerts or daily forecasts directly to users for their favorite locations.
*   **Progressive Web App (PWA) Features**: Enhance the application with offline capabilities, installability, and improved performance through PWA standards.
*   **Internationalization (i18n)**: Support multiple languages to cater to a broader global audience.
*   **Historical Weather Data**: Provide access to past weather conditions for specific dates and locations.
*   **Alternative Weather Data Sources**: Integrate with additional weather APIs to offer data redundancy and potentially greater accuracy or specialized forecasts.