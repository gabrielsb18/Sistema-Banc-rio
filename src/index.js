const express = require("express");
//instalamos uma nova biblioteca chamada UUID
const {v4: uuidv4} = require("uuid");

const app = express();
app.use(express.json());

const customers =[];

//MIDDLEWARE RESPONSÁVEL POR VERIFICAR SE A CONTA EXISTE
function verifyIFExistsAccountCPF(request, response, next){
    const {cpf} = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if(!customer) {
        return response.status(400).json({error: "Customer not found"});
    }

    //"Definindo o acesso ao customer"
    request.customer = customer;

    return next();
}

//MIDDLEWARE RESPONSÁVEL POR VERIFICAR O SALDO DA CONTA
function getBalance(statement) {
    //Vai pegar as informações do statement e vai fazer um reduce para pegar o valor do saldo
    const balance=statement.reduce((acc, operation)=>{
        if(operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

//FUNÇÃO RESPONSÁVEL POR CRIAR CONTA
app.post("/account", (request, response) => {
    const {cpf, name} = request.body;

    // Irá verificar se minha variavel é igual e se o valor é igual a um cpf ja existente

    const customerAlreadyExists =
        customers.some((customer) => customer.cpf === cpf );

    // Se já existir um cpf ele vai retornar um erro e não vai permitir a adição de uma nova conta
    //Se não exisitir ele irá permitir

    if(customerAlreadyExists) {
        return response.status(400).json({error: "Customer already exists! "});
    }

    //Definimos as informações que nossa conta terá atráves do customers

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });

    return response.status(201).send();
});

//FUNÇÃO RESPONSÁVEL POR TIRAR EXTRATO
app.get("/statement/", verifyIFExistsAccountCPF,(request, response)=> {
    //Existe uma maneira de reapssar a informação que estamos consumindo no midleware para as demais rotas, através do request
    const {customer} = request;
    return response.json(customer.statement);
});

//Função responsável por realizar um extrato por data
app.get("/statement/date", verifyIFExistsAccountCPF,(request, response)=> {
    const {customer} = request;
    const {date} = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) =>
        statement.created_at.toDateString() === new Date(dateFormat).toDateString());

    return response.json(statement);
});

//FUNÇÃO RESPONSÁVEL POR REALIZAR O DEPOSITO
app.post("/deposit",verifyIFExistsAccountCPF,(request, response) => {
    const {description, amount} = request.body;

    const {customer} = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

//FUNÇÃO REPONSÁVEL PELO SAQUE DA CONTA
app.post("/withdraw", verifyIFExistsAccountCPF, (request,response)=> {
    const {amount} = request.body;
    const {customer} = request;

    const balance = getBalance(customer.statement);

    if(balance < amount){
        return response.status(400).json({error: "Unsufficient funds!"});
    }

    const statementOperation = {
        amount,
        creted_at: new Date(),
        type: "debit"
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

//FUNÇÃO RESPONSÁVEL POR ATUALIZAR O NOME DO USUARIO DA CONTA
app.put("/account", verifyIFExistsAccountCPF, (request,response) => {
    const {name} = request.body;
    const {customer} = request;

    customer.name = name;

    return response.status(201).json({msg: "Nome Atualizado com Sucesso!"});
});

app.get("/account", verifyIFExistsAccountCPF, (request, response) => {
    const {customer} = request;

    return response.json(customer);
});

app.listen(3333, () => {
    console.log("Servidor funcionando na Porta 3333");
});