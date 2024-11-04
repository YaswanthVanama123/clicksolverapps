const admin = require('firebase-admin');

// const serviceAccount = {
//   "type": "service_account",
//   "project_id": "clicksolver-64687",
//   "private_key_id": "8d5d5130fecabf276c97aa9e2de9b92f5ac9dd88",
//   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCcu7xwnGSunr7S\nLLVaF22hHJSdPjm2Abj+Y7DT3xtw4fCXwmk3MpYU/3iWsa2Om2xhwuMZusUxVj1G\nbFzFUZWdCDVgAKhzaOdR/g4raviYlHJEtPXMA0k8p8hIJyyX6TRTGxoiO0fJvjwO\nnW2GtaIF4d46CPKoXVjyQmWL4z5fP4mLovmv26h/Twe5AMHPkQueDSg1+X72mKf3\nkDv2kpFFz+5Kg/S1Y5f+xT+5GknS1Ji3aZccbOKRGPkUO1i2WJ1priMSu14/Wvdo\n9lFiizzArQy8nwqA8lrJOPrW2vu+ZF2+07WbqayWUrn7VVM/p4XR6w4umEF61Xn+\nCDmWIrjjAgMBAAECggEAPszccxS/JNa3p/hBDCGyDCmrBJxfvGVRTiD8w9A0KxVk\n9THxPaw3xZ8dnuf/nlH5aeyQWYlkJOIkuDiILYoElECrPlXVKTUh5tEQtWXtyRlF\n9fC6Qi4Y5MRntD16GT5YeGo2HPw6xgPDBaofrifODWRUylU2ga6xipR/Ir+BiOEI\ndU1cksHSI1wQR9S1Qu2jcCnlSAJG4KuNl6sOU0x7MYlNE8zqGlo+66QSsVJuttF7\n0CQumc7jPmpkLvVz2WxqNpu46D9f1JpYsnjRl2ZLon2nlkMVCPHgSrCBJktmd+iW\ng87cAnFc1BMLavUo4TEkDE7hhZQoRY+eu9aXjN8OjQKBgQDNceT7Mtz/iehRKJwA\nlRE2mvKFWArvDIi/GnmN6comvfnZLw2jed2/DQBfvzhhRrLXEaQTwqmtX2G1FIM+\njJGzMikfN6WF1eoLdqW028J3FspVmpazD3IniW93+IcQpLSIF58/pqa6gM17guMt\nnyEMQvW/ffblb7gmMD5c9s6GjQKBgQDDTTuERAdDrk5FenaxGQNUrh67M3QALYAh\niBPAGzGNfqSlGMqDpCdknMnRtu0VyNTHOQDuE4grESsDRdnfxM45p7mB8qBF/7uJ\nVXNoysYcQAjcozkFAv0YZnK+PG7Y1TXaUajzm2p5zuaqFUtfXHfl4ODnmeJuAigL\nGOo1p3VZLwKBgGhZ2XzeMPJ7Ec1nWxXQoZWizlx8g9E4BJ1MzUEP5uYWyLlP9RV7\n6O4JpI79iZ2fU2d6RmTjE1xEflSDvsYekEL8z3ZTxXddWCvKcBCVLwleQheJFdKN\nneYHIN9HFROXFTurA/BIrZc9pSF/MfUSRq77s+c4DBgtztNW3dZKZkxhAoGAFyhi\nRUW3wsu5Vj22MzuvDGx1EmeAesDqb49uIBpZXtjEdxsgcEmXrjN1LtvM8wdUS6cz\nuAcy30By5Dl1IzZ36Zg8w+7cGFDBkQBD5godQZ5KLrdf/HslPa5wLqSF1Eo7z35d\nVT15e6YP7d0GifEx+l0W7f9uPPMegmpa4y/PF1sCgYAoZOlEI8aPJQk3KmqGO8MV\nloIgycdocBT2sopzysp+HmwuQmAk81P0OcVDWRjHMi173ylA6Jv7XZ2b4o8rVQQe\nT4zVcoXY53onLQIGbHk5kAcTp2fusSWKoX3rAT9HRPcl+3MwNLObI1A73USni+Yh\nAaendpDzWRkkfEFfbsl1Lw==\n-----END PRIVATE KEY-----\n",
//   "client_email": "firebase-adminsdk-4vqvm@clicksolver-64687.iam.gserviceaccount.com",
//   "client_id": "115758623859948786929",
//   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
//   "token_uri": "https://oauth2.googleapis.com/token",
//   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-4vqvm%40clicksolver-64687.iam.gserviceaccount.com",
//   "universe_domain": "googleapis.com"
// };

const serviceAccount = {
  "type": "service_account",
  "project_id": "clicksolver-64687",
  "private_key_id": "ae0a818a9e2faee93d88d3d6936c67bdb6286203",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCYtOmY1orKu/OS\nk9y5vxcSTi6y6eWCu6FgXF4l95v/NAj9BF395nsE796R9o6RjH9oM7UpK6pN8oVv\ntYQQXh3PQUlE4j6+lS6mWIxecQKNzAaU5SM+s/TZWQ803CTHkpL20CvIOSeGKzOW\nr0zg5PuQ05oXBJu0gcWLwKaBiwMDCwlJInzt3Fjd5bLmzuuX7z8WPSBVLDI6oAte\nCMHzkljDg56XgckXg6wVC2Qz1gYoE/hU1JUrhdAbLZAdYyiCehhwoMRL/kl2+k2S\n+2mNv9SrojlEGxpiWN2YAKc0fIlLngn9gZIPvny74nMccEsNtj3sokJLPjWc8xBZ\npUu+0N0lAgMBAAECggEAIyJ+27BDI0Wu01MLdj5B+e98naQkrxlqFiBydgRcQ1HO\n3p4uXRB2Tgq9mDJVF6ZumwRIopYeG0yZSHxITDbHX4v7JmryuklbQCE//Ku+RW9D\ntWbqHs9rXsW3srcTDEsMXtbDOBB0aFGQz1L6moT835PcEH86LwQrtk2nUcdw9DYu\n2MRpdmrPK8Lbs37nFV2vFA32uxtCaW+cdc1DR2HHfXzmds69+PQxBBDIAYpFsLBT\nZo7/EbYolLTVQ+RSOR+r/SMpzY0ISC8hi9R8zuNJqYhyvVrREQi5j3Wx2OUhdNzH\nitN+qSUdOrNmqXujQNWQyO1v0eytntz0F/4FTXMYQQKBgQDVOBvNMgsCtb4O67TB\nULBk1A4SdHPhgf0wQeymY4TxfdgJjyadtwwD3LF3G++xw5qdes/upMYqBxnLYMZD\njKiJReYZRp7OYDlJEedZ+AWccW5IPcImd21PDj2UBmNLJDSMS/J0qpIlSndU52vH\nfbe3qMwIGsGSdEUbW/FFkVeawQKBgQC3WJybXzwPYWx/cYXi4hn/4YWA0rFE8r/3\nNHF8f2rp4UnGgGwIKGi3pw+cKhuPDgUZhie3Jei9/UT1B6BrZL47j16R941DeazQ\njbnen6/24BjVDawdRfHKSZUlPh4GRK1mBEGILniemVoD9SJzJUsjSCZMMklY8fWs\n0gj5ho+PZQKBgD+Ci/1t94uiGO+W0+t1HmWaKGrk1xOHxaPXLydMo2/PPUdzpVv7\nBxArb4z7/ESl7+sShtcdq40fOlazB7tdLWJeOLC0sV7lmIqkU5Yf44P64Y+RHcCZ\neCzBICR0VqUuLpzPjnOjzw5ehPb8S8VLNCr3k3aiiaAXE/KXS2GebkrBAoGASk6W\ngf3x+IXSlEAtNAvQ37zF/7TkdX4wwP63M+7sJMfSv6mSnyfJcQ07LV5/dtYGyRZv\nCDJMBpwcE3a41G2rD7aGbIA492zb1lZqS0jK5zJhvg9hfye22/ZAhSyMvJue7yaw\nbIHxDs42Bj6WbLZjonP+WYlT4sGFgTpKut6HVmUCgYEArg2bcKFLNLpTjsVC8d3g\nU3veOa/mWUl8+T/WDtM9XYznQF1byp0jf7CouaXhqmZ/KzcWvw2gcuytz5iZ1OGq\ncMPh/X5mZEQsdtCLZ2qatp1cMauwdE5ld2k6ByYhrtzhVisw6Ukmb7oBVmfMVuMh\n2i6Jj1PxNuhpnTz2G3HdGmo=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase@clicksolver-64687.iam.gserviceaccount.com",
  "client_id": "101989226887834379406",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase%40clicksolver-64687.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
;


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
