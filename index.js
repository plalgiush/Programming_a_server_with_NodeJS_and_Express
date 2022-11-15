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
    Person.find({}).then((persons) => {
        const qty = Number(persons.length)
        process.env.TZ = 'Europe/Amsterdam'
         const time = new Date().toString()

        response.send(`
            <p>Phonebook has info for ${qty} people</p>
            <p>${time}</p>
        `)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(persons => {
            if (persons) {
                response.json(persons)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error), console.log(persons))
})

app.post('/api/persons', (request, response, next) => {
    const body = request.body
    
    if (!body.name || !body.phone) {
        return response.status(400).json({
            error: 'content missing'
        })
    }

    const person = new Person ({
        name: body.name,
        phone: body.phone,
    })

    return person.save()
        .then(savedPerson => {
            response.json(savedPerson)
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndRemove(request.params.id)
        .then(() => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError') {
      return response.status(400).send({ error: 'malformatted id' })
    } 
  
    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})