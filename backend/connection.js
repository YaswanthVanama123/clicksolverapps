// const { Client } = require("pg");

// const client = new Client({
//   host: "localhost",
//   user: "postgres",
//   port: 5432,
//   password: "Yaswanth@123",
//   database: "clicksolver",
// });

// client
//   .connect()
//   .then(() => console.log("Connected to PostgreSQL database"))
//   .catch((err) => console.error("PostgreSQL connection error", err));

// module.exports = client;

// deployed in neon console with vanamayaswanth1@gmail.com

// const { Client } = require("pg");

// const client = new Client({
//   connectionString:
//     "postgresql://clicksolver_owner:OJT9LfsicDm2@ep-snowy-mode-a1k7v5v0.ap-southeast-1.aws.neon.tech/clicksolver?sslmode=require",
// });

// client
//   .connect()
//   .then(() => console.log("Connected to Neon PostgreSQL database"))
//   .catch((err) => console.error("PostgreSQL connection error", err));

// module.exports = client;

// after deploy in aws postrelSql

const { Client } = require("pg");

const client = new Client({
  host: "clicksolver-db.cls4w8866ilh.ap-south-1.rds.amazonaws.com", // RDS endpoint
  user: "postgres",
  port: 5432,
  password: "Yaswanth123", // Use your RDS password
  database: "clicksolver",
  ssl: {
    rejectUnauthorized: false, // For secure connection; set to 'true' if you have a valid CA certificate
  },
});

client
  .connect()
  .then(() => console.log("Connected to Amazon RDS PostgreSQL database"))
  .catch((err) => console.error("PostgreSQL connection error", err));

module.exports = client;

// const { Client } = require("pg");

// const client = new Client({
//   host: "db", // Use 'db' as the hostname, which is the service name in docker-compose.yml
//   user: "postgres",
//   port: 5432,
//   password: "Yaswanth@123",
//   database: "clicksolver",
// });

// client
//   .connect()
//   .then(() => console.log("Connected to PostgreSQL database docker"))
//   .catch((err) => console.error("PostgreSQL connection error", err));

// module.exports = client;
