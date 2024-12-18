import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secret_name = "my-backend/private_key";
const region = "ap-south-1";

const getSecret = async () => {
  const client = new SecretsManagerClient({ region });

  try {
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secret_name })
    );

    return JSON.parse(response.SecretString); // Parse if the secret is stored as JSON
  } catch (error) {
    console.error("Error fetching secret:", error);
    throw error;
  }
};

export default getSecret;
