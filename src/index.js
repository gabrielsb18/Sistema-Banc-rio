const express = require("express");
//instalamos uma nova biblioteca chamada UUID
const {v4: uuidv4} = require("uuid");

const app = express();
app.use(express.json());

const customers =[];

//Midleware
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

//Segunda maneira de definir um Midleware
//Será aplicado em todas as rotas
//app.use(verifyIFExistsAccountCPF);

//FUNÇÃO RESPONSÁVEL POR TIRAR EXTRATO
app.get("/statement/", verifyIFExistsAccountCPF,(request, response)=> {
    //Existe uma maneira de reapssar a informação que estamos consumindo no midleware para as demais rotas, através do request
    const {customer} = request;
    return response.json(customer.statement);
});


app.post("/deposit",verifyIFExistsAccountCPF,(request, response) => {
    const {description, amount} = request.body;

    const {customer} = request;

    const statementOperation = {
        description,
        amount,
        cretea_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
})

app.listen(3333);