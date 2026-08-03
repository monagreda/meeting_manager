import express from 'express';
import Group from '../models/Group.js';
import { nanoid } from 'nanoid';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Campos del usuario que queremos proyectar en las respuestas
const USER_FIELDS = 'username email availability sleepStart sleepEnd';

// 1. Crear sala
router.post('/create', authMiddleware as any, async (req: any, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.userId; // Extraído de la sesión JWT
    const code = nanoid(6).toUpperCase();

    const group = await Group.create({
      name,
      code,
      creator: userId,
      members: [userId]
    });

    // Populamos los datos del usuario creador antes de responder
    const populatedGroup = await Group.findById(group._id).populate('members', USER_FIELDS);

    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la sala' });
  }
});

// 2. Unirse a sala
router.post('/join', authMiddleware as any, async (req: any, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId; // Extraído de la sesión JWT

    const group = await Group.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $addToSet: { members: userId } },
      { new: true }
    ).populate('members', USER_FIELDS); // Poblamos para devolver objetos completos

    if (!group) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Error al unirse a la sala' });
  }
});

// 3. Obtener/Actualizar información de la sala (ÚNICA RUTA GET)
router.get('/:code', authMiddleware as any, async (req: any, res) => {
  try {
    const group = await Group.findOne({ code: req.params.code.toUpperCase() })
      .populate('members', USER_FIELDS);

    if (!group) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la sala' });
  }
});

export default router;