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
  "private_key_id": "cd1d093049c1327a247a9e2efe8c95fba078bd0d",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCkU+wsex9GRWlT\nYdNTt43Fx047uzie1WmAoVdwVcSQan8bxYYMrpqsG84tqVsyXw8jLomazX/zAKAn\nfrUv6Fk7WbLdXJJkupHMhL81JDEyZMs9UpSLiynGOe+BgYs7E7FZYdkdDoHHrVdV\n7DF6XDJKuldMg7eFJc1wpn7VoSGqZ1k/uMw3MmY5GP0zR5b5AqiS9WsKIpUDObIi\nR9ZNi/1Nnu6O2lmole7E0Al42IgYIJmgUTue6O5yy4gJgoJpA/gYs5VZa7Fxuwfn\nCAQkz05oS5xAQR2T5LDyJzTeKZ7z7wa5aiwqBB+2BffWR3bJUQKfrvI8/XV2Skrk\n6mQ4XY3pAgMBAAECggEAE57VlyYIQOquvb7zbY6ABfpbE/SxuP1AQJSDDS2gb6HX\nlWhLLh5250/WmUscUXJaK1g2I96fhVMwzCZr2dGDPfviyF1yOUaxe9rpvZ2Zpiu0\nvJisldDC5yEpwKvIBQC/7y0osDh4NHA0+lReP/7cHmILZF5hvisaUXX/tOAtVdwa\nJGgs4EAq+PzvxdqrS/0rjps2W8zepJh5tkXuA8dJgZBoaRHTC/1iaVw0UTajt7qM\n6MKABimAbhsiDxsjtqrylfJZuncJNeZPCJtumJyVHvC10RfTaH+r91unUjfgU9+I\nICV7z1ywp0LCY1QdvsW5RuK6W4yLYvBaDS5ZEvG1gQKBgQDSRiztBsA2lkMDJp6h\nTsYsza5bKTFxPCrUIuwdcngoDDAPW/sd9TH5+Prm0Ga9xAstrqoYEod51KtjJ9CI\ne76NcI6aO1/W64mbdTTe1bdKSF5jL055XgRrv8VmWNYxTvEB6vc0sTeyhDznf+0m\nUVGkgUvw0LMleFOkGC9FurTlWQKBgQDID/I62DXiQin/ldKA6fvaKZ/BXFaC1YO3\nqbhtyGtvrajHh5kN56ftHcw/TaCTc8bAmhensqxrojq0KxpHmaDZPTtWGwtO3PiA\nJGeBLE+sl94mIVmdKn0HTD1nmf7n6T3hOOsqWYnqRJ26IPHAr+SriWZE6AYq+Y4w\n16UX1wuLEQKBgQCx0TBavRO81bMTrgwFgzUpXEIuyxYJmQTq4iFkAZJE45Gc237v\nZZN+vaOHnwLTRT7iwcsLklfImiTZNCkv0d1hhKbDHKS+fe6fbS1pp7dZdPuEytOE\n5RG+AK0xEL0Jc6Vxpr6oa5kbOKK8bj0g4zG0eLa8jfCBJlEs+lq3j907+QKBgGwf\nSh+JWF3GumH6O8EWM9ntIvzihZLCCCTLofQbHA1IQm5Ll2lPaI8aypbvwjfOm3ze\nCqjERLELBUT4AoTtv2OI1zeq+AqQG/FNO28xXoH9tb7PyVnKa7X0+z6xmHUHtjyx\ngU7rA0FMAh5kzaMArMoUQOQ+rY6uPq2g7gWbYA6xAoGAVSXwwSEJtzAho70bGVlS\nd6b3/iiChuyDX9cGYLUzkk19uYAM0TIycmoF6UoBwhCHee15HkwD3B3n42nQyTLz\nzayJb6F+cr4q4nwvvZw8V55Yd9L2TnB/iFQa/YrnzqbhDh/8BbJllo3qvqItmH33\nL52uUpB1EGe6nRbMlAGk9+o=\n-----END PRIVATE KEY-----\n",
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
