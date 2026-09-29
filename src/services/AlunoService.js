const prisma = require("../databases/prisma");
const AlunoInvalidoError = require("../errors/AlunoInvalidoError");
const AlunoNaoEncontradoError = require("../errors/AlunoNaoEncontradoError");

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

    async findById(id){
        const aluno = await prisma.aluno.findUnique({
            where: { id: Number(id) }
        });

        if(!aluno){
            throw new AlunoNaoEncontradoError();
        }

        return aluno;
    }

    async update(id, dadosAluno){
        if(!dadosAluno || typeof dadosAluno !== "object" || Object.keys(dadosAluno).length === 0){
            throw new AlunoInvalidoError("Informe pelo menos um campo válido para atualizar.");
        }

        const dadosAtualizacao = {};
        const camposPermitidos = ["nome", "email"];

        for(const campo of camposPermitidos){
            if(dadosAluno[campo] !== undefined && dadosAluno[campo] !== null && String(dadosAluno[campo]).trim() !== ""){
                dadosAtualizacao[campo] = dadosAluno[campo];
            }
        }

        if(Object.keys(dadosAtualizacao).length === 0){
            throw new AlunoInvalidoError("Informe pelo menos um campo válido para atualizar.");
        }

        // Reaproveitamos AlunoInvalidoError para payload vazio/sem campos válidos e para
        // email duplicado porque ambos representam erro de entrada/validação de negócio,
        // e o Controller já responde de forma padronizada para qualquer ApiError.
        await this.findById(id);

        try{
            return await prisma.aluno.update({
                where: { id: Number(id) },
                data: dadosAtualizacao
            });
        }catch(error){
            if(error.code === "P2002"){
                throw new AlunoInvalidoError("E-mail já cadastrado.");
            }
            throw error;
        }
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