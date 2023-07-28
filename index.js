const admin = require("firebase-admin");
const cors = require('cors');
const express = require("express");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3001; // Escolha uma porta para sua API

const serviceAccount = require("./apigrupofuc-firebase-adminsdk-fslyg-07935fb606.json");

// EMAIL
const SibApiV3Sdk = require("sib-api-v3-sdk");
const sendinblueApiKey =
  "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";

const conteudoEmail = {
  assunto: "Inscrição EnFUC 2023",
  texto: "Olá, Você recebeu uma nova inscrição para o ENFUC",
  html: "<p>Olá, este é um <b>e-mail de teste</b> enviado pelo Node.js com Sendinblue!</p>",
};

// Configuração do cliente do Sendinblue
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = sendinblueApiKey;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://apigrupofuc-default-rtdb.firebaseio.com/", // URL do seu projeto Firebase (Realtime Database)
});

app.get("/dados", (req, res) => {
  const db = admin.database();
  const ref = db.ref("registros"); // Escolha uma pasta no Realtime Database

  ref
    .once("value")
    .then((snapshot) => {
      const data = snapshot.val();
      const dataArray = Object.values(data); // Transforma o objeto de objetos em um array de objetos
      res.json(dataArray);
    })
    .catch((error) => {
      res.status(500).json({ error: "Erro ao ler dados do Firebase" });
    });
});

app.post("/dados", (req, res) => {
  // Supondo que você recebe os dados em formato JSON no corpo da requisição
  const newData = req.body;

  const db = admin.database();
  const ref = db.ref("registros"); // Escolha uma pasta no Realtime Database

  ref
    .push(newData)
    .then(() => {
      res
        .status(201)
        .json({ message: "Dados adicionados com sucesso", data: newData });

        enviarEmail(newData);
    })
    .catch((error) => {
      res.status(500).json({ error: "Erro ao adicionar dados no Firebase" });
    });
});


async function enviarEmail(body) {


    try {
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  
      // Construa a mensagem do e-mail
      const email = new SibApiV3Sdk.SendSmtpEmail();
      email.sender = { name: 'ENFUC', email: 'felizesunidosemcristo@gmail.com' };
      email.to = [{ email: 'felizesunidosemcristo@gmail.com', name: body.nome }];
      email.subject = conteudoEmail.assunto;
      email.textContent = body.html;
      email.htmlContent = body.html;
  
      // Envie o e-mail
      const response = await apiInstance.sendTransacEmail(email);
  
      console.log('E-mail enviado com sucesso:', response);
    } catch (error) {
      console.error('Erro ao enviar o e-mail:', error);
    }
  }

app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});

// 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
