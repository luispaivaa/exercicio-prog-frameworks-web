require('dotenv/config');
const express = require("express")
const alunoRoutes = require("./routes/alunoRoutes");

const app = express();
app.use(express.json());
app.use((request, response, next)=>{
    console.log("Executando antes das rotas");
    next();
});
app.use("/alunos", alunoRoutes);

const port = process.env.PORT || 3000;

app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
});

