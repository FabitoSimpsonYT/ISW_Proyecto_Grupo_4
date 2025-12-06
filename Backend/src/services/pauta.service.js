import { AppDataSource } from "../config/configDb.js";
import { Pauta } from "../entities/pauta.entity.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";

const pautaRepository = AppDataSource.getRepository(Pauta);
const evaluacionRepository = AppDataSource.getRepository(Evaluacion);

export async function createPautaService(data, evaluacionId) {
    let pauta;
    if (evaluacionId) {
        const evaluacion = await evaluacionRepository.findOneBy({id:evaluacionId});
        if (!evaluacion) return {error: "evaluacion no encontrada"};
        if(evaluacion.estado !== "pendiente"){
            return {error : "error al agregar una pauta a una evaluacion aplicada "};
        }
        pauta = pautaRepository.create ({...data, evaluacion});
    } else {
        pauta = pautaRepository.create({...data});
    }
    const savedPauta = await pautaRepository.save(pauta);
    return savedPauta;
}
export async function getPautaByIdService(id, user){
    const pauta = await pautaRepository.findOne({
        where: {id},
        relations:["evaluacion"],
    });
    if (!pauta) return {error : "pauta no encontrada"};

    if(user.role === "estudiante" && !pauta.publicada){
        return {error : "la puata no ha sido publicada"};
    }
    return pauta;
}

export async function updatePautaService(id, data, user) {
  const pauta = await pautaRepository.findOne({
    where: {id},
    relations: ["evaluacion"],
  });

  if (!pauta) return { error: "Pauta no encontrada" };
  if (user.role !== "profesor") return { error: "No autorizado" };
  if (pauta.evaluacion.estado !== "pendiente") {
    return { error: "No puede modificar esta pauta en una evaluación aplicada" };
  }

  Object.assign(pauta, data);
  const updatedPauta = await pautaRepository.save(pauta);
  return updatedPauta;
}

export async function deletePautaService(id, user) {
  const pauta = await pautaRepository.findOne({
    where: {id},
    relations: ["evaluacion"],
  });

  if (!pauta) return { error: "Pauta no encontrada" };
  if (user.role !== "profesor") return { error: "Solo el profesores puede eliminar la pauta" };
  if (pauta.evaluacion.estado !== "pendiente") {
    return { error: "No puede eliminar una pauta de evaluación aplicada" };
  }

  await pautaRepository.remove(pauta);
  return { success: true };
}