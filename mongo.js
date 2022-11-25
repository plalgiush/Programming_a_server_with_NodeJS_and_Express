const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('Please provide the password as an argument: node mongo.js <password>')
  process.exit(1)
}

const password = process.argv[2]

const url = `mongodb+srv://plalgiush:${password}@cluster0.a7y5bmc.mongodb.net/?retryWrites=true&w=majority`

const personSchema = new mongoose.Schema({
  name: String,
  phone: String,
})

const Person = mongoose.model('Person', personSchema)

const getPersonsList = () => {
  mongoose
    .connect(url)
    .then(() => {
      Person.find({}).then(result => {
        result.forEach(persons => {
          console.log(persons.name, persons.phone)
        })
        mongoose.connection.close()
      })
    })
    .catch((err) => console.log(err))
}

const setPersonInfo = (name, phone) => {
  mongoose
    .connect(url)
    .then(() => {
      console.log('connected')

      const persons = new Person({
        name: name,
        phone: phone,
      })

      return persons.save()
    })
    .then(() => {
      console.log(`added ${name} number ${phone} to phonebook`)
      return mongoose.connection.close()
    })
    .catch((err) => console.log(err))
}

if (process.argv.length === 5) {
  setPersonInfo(process.argv[3], process.argv[4])
} else {
  getPersonsList()
}