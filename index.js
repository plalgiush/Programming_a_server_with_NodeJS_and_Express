require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const PersonModel = require('./models/person')

if (process.argv.length < 3) {
  console.log('Please provide the password as an argument: node mongo.js <password>')
  process.exit(1)
}

const password = process.argv[2]

const url = `mongodb+srv://plalgiush:${password}@cluster0.a7y5bmc.mongodb.net/?retryWrites=true&w=majority`

mongoose.connect(url)

const personSchema = new mongoose.Schema({
  name: String,
  phone: String,
})

personSchema.set('toJSON', {
    transform: (document, returnedObject) => {
      returnedObject.id = returnedObject._id.toString()
      delete returnedObject._id
      delete returnedObject.__v
    }
})

const Person = mongoose.model('Person', personSchema)

app.use(cors())
app.use(express.static('build'))

let persons = [
    {
        "id": 1,
        "name": "Arto Hellas",
        "phone": "040-123456"
    },
    {
        "id": 2,
        "name": "Ada Lovelace",
        "phone": "39-44-5323523"
    },
    {
        "id": 3,
        "name": "Dan Abramov",
        "phone": "12-43-234345"
    },
    {
        "id": 4,
        "name": "Mary Poppendieck",
        "phone": "39-23-6423122"
    }
]

app.use(express.json())

morgan.token('body', (request) => JSON.stringify(request.body))

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

app.get('/', (request, response) => {
    response.send('<h1>Hello World!</h1>')  
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
})

app.get('/api/info', (request, response) => {
    const qty = Number(persons.length)
    process.env.TZ = 'Europe/Amsterdam'
    const time = new Date().toString()

    response.send(`
        <p>Phonebook has info for ${qty} people</p>
        <p>${time}</p>
    `)
})

app.get('/api/persons/:id', (request, response) => {
    // const id = Number(request.params.id)
    // console.log(id)
    // const person = persons.find(person => person.id === id)

    PersonModel.findById(request.params.id).then(person => {
        response.json(person)
    })

    // console.log(person)
    // if (person) {
    //     response.json(person)
    // } else {
    //     response.statusMessage = "Current person does not match";
    //     response.status(404).end();
    // }
})

const generateId = () => {
    const maxId = persons.length > 0
        ? Math.max(...persons.map(n => n.id))
        : 0
    return maxId + 1
}

app.post('/api/persons', (request, response) => {
    const body = request.body
    const name = persons.filter(person => person.name === body.name).map(name => name.name).join()
    
    if (!body.name || !body.phone) {
        return response.status(400).json({
            error: 'content missing'
        })
    }

    if (name === body.name) {
        return response.status(400).json({
            error: 'name is busy'
        })
    }

    const person = new Person ({
        id: generateId(),
        name: body.name,
        phone: body.phone,
    })

    return person.save().then(savedPerson => {
        response.json(savedPerson)
    })
})

app.delete('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    persons = persons.filter(person => person.id !== id)

    response.status(204).end()
})

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})