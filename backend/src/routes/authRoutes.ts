import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import User from '../models/User.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware as any, getMe);

// GET /api/auth/profile
router.get('/profile', authMiddleware as any, async (req: any, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({
            sleepStart: user.sleepStart || '23:00',
            sleepEnd: user.sleepEnd || '07:00',
            availability: user.availability || []
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener disponibilidad' });
    }
});

// POST /api/auth/availability (Guardar la nueva disponibilidad)
router.post('/availability', authMiddleware as any, async (req: any, res) => {
    try {
        // Recibimos 'availability' o 'weeklyAvailability' del frontend
        const { sleepStart, sleepEnd, availability, weeklyAvailability } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId, // 👈 CORREGIDO: Cambiado req.user.id por req.user.userId
            {
                sleepStart,
                sleepEnd,
                availability: availability || weeklyAvailability || []
            },
            { new: true }
        );

        res.json({ message: 'Disponibilidad guardada con éxito', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar disponibilidad' });
    }
});

export default router;