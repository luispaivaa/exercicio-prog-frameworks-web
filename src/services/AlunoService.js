const prisma = require("../databases/prisma");
const AlunoInvalidoError = require("../errors/AlunoInvalidoError");

class AlunoService{

    async findMany(page = 1, pageSize = 10, orderBy = "id", order = "asc"){
        const camposPermitidos = ["id", "nome", "email", "createdAt", "updatedAt"];
        const campoOrdenacao = camposPermitidos.includes(orderBy) ? orderBy : "id";
        const tipoOrdenacao = order === "desc" ? "desc" : "asc";

        const [alunos, total] = await Promise.all([
            prisma.aluno.findMany({
                skip: (Number(page) - 1) * Number(pageSize),
                take: Number(pageSize),
                orderBy: {
                    [campoOrdenacao]: tipoOrdenacao
                }
            }),
            prisma.aluno.count()
        ]);

        return { alunos, total };
    }

    async create(aluno){
        const {nome, email} = aluno;
        if(!nome || !email){
            throw new AlunoInvalidoError();
        }
        //create = insert
        //update = update
        //delete = delete
        //findMany = select * from
        const novoAluno = await prisma.aluno.create({data:aluno});

        return novoAluno;
    }
}

module.exports = new AlunoService();