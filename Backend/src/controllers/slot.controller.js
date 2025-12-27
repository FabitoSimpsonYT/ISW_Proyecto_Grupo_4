// src/controllers/slot.controller.js
import { AppDataSource } from "../config/configDb.js";
import { Slot } from "../entities/slot.entity.js";

const slotRepository = AppDataSource.getRepository(Slot);

export const generarSlots = async (req, res) => {
  // Tu código de generación (ya lo tienes bien)
};

export const getSlotsEvento = async (req, res) => {
  // Tu código (ya lo tienes bien)
};

export const eliminarSlot = async (req, res) => {
  // Tu código (ya lo tienes bien)
};

export const quitarAlumnoSlot = async (req, res) => {
  // Tu código (ya lo tienes bien)
};

// NUEVA FUNCIÓN PARA INSCRIBIR ALUMNO
export const inscribirSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const alumnoId = req.user.id;

    const slot = await slotRepository.findOne({
      where: { id: parseInt(slotId), disponible: true },
      relations: ["evento"]
    });

    if (!slot) {
      return res.status(400).json({ message: "Slot no disponible" });
    }

    // Validar si permite parejas (opcional)
    if (slot.alumno) {
      return res.status(400).json({ message: "Slot ya ocupado" });
    }

    slot.alumno = { id: alumnoId };
    slot.disponible = false;
    await slotRepository.save(slot);

    res.json({ message: "Inscrito correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al inscribir" });
  }
};