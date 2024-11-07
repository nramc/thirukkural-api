# Thirukkural API

> Connecting ancient Tamil philosophy with today’s digital landscape.

[![Website](https://img.shields.io/badge/website-online-brightgreen.svg)](https://tamil-kural-api.vercel.app/)

Welcome to the Thirukkural API project!

This project provides a simple REST API to access Thirukkural verses, using a serverless function deployed on Vercel.
Additionally, it includes a React-based frontend to display a random "Kural of the Day" and information about how to use
the API.

## Features

- **Kural of the Day**: Displays a random Thirukkural verse with its meaning in multiple languages.
- **REST API**: A simple serverless API that returns requested Kural in JSON format.
- **Modern Web Technology**: Built using TypeScript, React, and Vercel's serverless architecture.

---

## Getting Started

### Prerequisites

Make sure you have the following installed on your local machine:

- **Node.js** (version 20.x or higher)
- **npm** or **yarn**
- **Vercel CLI** (for deployment)

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/nramc/thirukkural-api.git
   cd thirukkural-api
    ```

2. **Install Dependencies**

   ```bash
   npm install
   or
   yarn install
   ```

3. **Run the Project Locally**

   ```bash
   npm run dev
   ```

4. Your application will be available at [http://localhost:3000](http://localhost:3000)

---

## Project Structure

- **/public/data/kurals.json**: Contains the full list of Thirukkural verses in JSON format.
- **/services/KuralService.ts**: A service file that loads and retrieves Kurals.
- **/api/kural/**: A serverless function that returns a requested Kural as JSON.
- **/api/daily/**: A serverless function that returns a Kural of the day as JSON.
- **/api/random/**: A serverless function that returns a random Kural as JSON.
- **/pages/index.tsx**: The main React component for the homepage.

---

## Usage

### Kural of the Day API

You can use the following endpoint to get Thirukkural of the day:

```http request
GET https://tamil-kural-api.vercel.app/api/daily
```

Example Response

```json
{
  "chapter": "கடவுள் வாழ்த்து",
  "kural": [
    "அகர முதல எழுத்தெல்லாம் ஆதி",
    "பகவன் முதற்றே உலகு."
  ],
  "number": 1,
  "section": "அறத்துப்பால்",
  "meaning": {
    "ta_mu_va": "மு.வ : எழுத்துக்கள் எல்லாம் அகரத்தை அடிப்படையாக கொண்டிருக்கின்றன. அதுபோல உலகம் கடவுளை அடிப்படையாக கொண்டிருக்கிறது.",
    "ta_salamon": "சாலமன் பாப்பையா : எழுத்துக்கள் எல்லாம் அகரத்தில் தொடங்குகின்றன; (அது போல) உலகம் கடவுளில் தொடங்குகிறது.",
    "en": "As the letter A is the first of all letters, so the eternal God is first in the world."
  }
}
```

### Kural API

You can use the following endpoint to get Thirukkural by kural id(1 <= id <= 1330):

```http request
GET https://tamil-kural-api.vercel.app/api/kural/{id}
```

Example

```http request
GET https://tamil-kural-api.vercel.app/api/kural/1
```

```json
{
  "chapter": "கடவுள் வாழ்த்து",
  "kural": [
    "அகர முதல எழுத்தெல்லாம் ஆதி",
    "பகவன் முதற்றே உலகு."
  ],
  "number": 1,
  "section": "அறத்துப்பால்",
  "meaning": {
    "ta_mu_va": "மு.வ : எழுத்துக்கள் எல்லாம் அகரத்தை அடிப்படையாக கொண்டிருக்கின்றன. அதுபோல உலகம் கடவுளை அடிப்படையாக கொண்டிருக்கிறது.",
    "ta_salamon": "சாலமன் பாப்பையா : எழுத்துக்கள் எல்லாம் அகரத்தில் தொடங்குகின்றன; (அது போல) உலகம் கடவுளில் தொடங்குகிறது.",
    "en": "As the letter A is the first of all letters, so the eternal God is first in the world."
  }
}
```

### Random Kural API

You can use the following endpoint to get random Thirukkural:

```http request
GET https://tamil-kural-api.vercel.app/api/random
```

Example Response

```json
{
  "chapter": "கடவுள் வாழ்த்து",
  "kural": [
    "அகர முதல எழுத்தெல்லாம் ஆதி",
    "பகவன் முதற்றே உலகு."
  ],
  "number": 1,
  "section": "அறத்துப்பால்",
  "meaning": {
    "ta_mu_va": "மு.வ : எழுத்துக்கள் எல்லாம் அகரத்தை அடிப்படையாக கொண்டிருக்கின்றன. அதுபோல உலகம் கடவுளை அடிப்படையாக கொண்டிருக்கிறது.",
    "ta_salamon": "சாலமன் பாப்பையா : எழுத்துக்கள் எல்லாம் அகரத்தில் தொடங்குகின்றன; (அது போல) உலகம் கடவுளில் தொடங்குகிறது.",
    "en": "As the letter A is the first of all letters, so the eternal God is first in the world."
  }
}
```

## Deployment

You can deploy this project on Vercel with the following steps:

1. **Login to Vercel**

   ```bash
   vercel login
   ```

2. **Deploy the Project**

   ```bash
      vercel 
   ```

3. Follow the prompts to complete the deployment.

---

## Technologies Used

- [React](https://react.dev/): For the frontend
- [TypeScript](https://www.typescriptlang.org/): For type-safe code
- [Vercel](https://vercel.com/): For serverless deployment
- [Node.js](https://nodejs.org/): Backend runtime for the serverless function
- [Renovate](https://docs.renovatebot.com/): Automated dependency updates

---

## Contribution

Any contributions you make are **greatly appreciated**.

If you like the project and have a suggestion that would make this better, please fork the repo and create a pull
request.
You can also simply open an issue with the tag "enhancement".

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add the AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is open-source and available under the MIT License.

---

## Contact

Ramachandran
Nellaiyappan [Website](https://github.com/nramc) | [Twitter](https://twitter.com/ram_n_74) | [E-Mail](mailto:ramachandrannellai@gmail.com)

---

## Credits

Sincere Thanks to following open source community for their wonderful efforts to make our life much easier.

- [Vercel](https://vercel.com/)
- [Next.js](https://nextjs.org/)

---

## Show your support

Give a ⭐️ if you like this project!

**Enjoy using the Thirukkural API and spreading the wisdom of Thirukkural!**

---

