import mongoose from 'mongoose';
import User from '../models/User.js'; // Asumiendo que existe un modelo User
import Group from '../models/Group.js'

const seedData = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/meeting-manager';
  await mongoose.connect(MONGO_URI);

  // Limpiar base de datos
  await User.deleteMany({});
  await Group.deleteMany({});

  // Crear Usuarios
  const users = await User.create([
    {
      username: 'Usuario Madrid',
      email: 'madrid@example.com',
      passwordHash: '$2b$10$e84...dummyhash',
      timezone: 'Europe/Madrid',
      availability: [
        { day: 0, start: '09:00', end: '17:00' }, // Lun-Vie
        { day: 1, start: '09:00', end: '17:00' },
        { day: 2, start: '09:00', end: '17:00' },
        { day: 3, start: '09:00', end: '17:00' },
        { day: 4, start: '09:00', end: '17:00' }
      ],
      sleepWindow: { start: '23:00', end: '07:00' }
    },
    {
      username: 'Usuario Caracas',
      email: 'caracas@example.com',
      passwordHash: '$2b$10$e84...dummyhash',
      timezone: 'America/Caracas',
      availability: [
        { day: 0, start: '09:00', end: '17:00' },
        { day: 1, start: '09:00', end: '17:00' },
        { day: 2, start: '09:00', end: '17:00' },
        { day: 3, start: '09:00', end: '17:00' },
        { day: 4, start: '09:00', end: '17:00' }
      ],
      sleepWindow: { start: '22:00', end: '06:00' }
    }
  ]);

  // Crear Grupo de prueba
  await Group.create({
    name: 'Reunión Transatlántica',
    code: 'TEST12',
    creator: users[0]._id,
    members: [users[0]._id, users[1]._id]
  });

  console.log('Seed exitoso');
  process.exit();
};

seedData();
