export default async function handler(req, res) {
  const apiBaseUrl =
    'https://factchecktools.googleapis.com/v1alpha1/claims:search?';

  const data = await fetch(
    `${apiBaseUrl}query=${encodeURIComponent(req.query.query)}&key=${
      process.env.FACTCHECKTOOLAPI
    }`,
  ).then((response) => response.json());

  res.json(data); // Send the response
}
