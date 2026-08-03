Lógica de Zonas Horarias, UTC y Algoritmo:

Matemática UTC: Representa o convierte la disponibilidad semanal y la ventana de sueño a minutos continuos de la semana en formato UTC ($0$ a $10079$ minutos, donde $0 = \text{Lunes 00:00 UTC}$) o rangos ISO normalizados, contemplando cambios de horario (DST / Daylight Saving Time).  

Ventana de Sueño: Parámetro obligatorio por usuario (ej. 23:00 a 07:00 local). El algoritmo debe tratar esta ventana como un "bloqueo estricto" ($\text{disponibilidad} = 0$).   

Algoritmo de Coincidencia Flexible (meetingEngine.ts):

   - Recibe: Lista de participantes (o ID de un Grupo) y duración de la reunión (configurable de 40 a 90 minutos).  
   - Filtra zonas de sueño locales -> Convierte disponibilidades a UTC -> Calcula la intersección común.  
   - Retorna múltiples opciones posibles de horario ordenadas de la más conveniente a la menos conveniente (evitando madrugadas o noches tardías para cualquier participante). 