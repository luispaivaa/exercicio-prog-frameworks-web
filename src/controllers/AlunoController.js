const alunoService = require("../services/AlunoService");

class AlunoController{

    async findMany(request, response){
        let {page, pageSize, orderBy, order} = request.query;
        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;

        const campoOrdenacao = orderBy || "id";
        const tipoOrdenacao = order === "desc" ? "desc" : "asc";

        const resultado = await alunoService.findMany(page, pageSize, campoOrdenacao, tipoOrdenacao);
        return response.status(200).json(resultado);
    }

    async create(request, response){
        try{
            const aluno = await alunoService.create(request.body);
            return response.status(201).json({aluno});
        }catch(e){
            return response.status(e.statusCode).json({error: e.message});
        }
    }
}

module.exports = new AlunoController();