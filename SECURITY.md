# Política de seguridad

## Alcance

Este repositorio produce un sitio estático de contenido educativo. No tiene
backend, no procesa formularios, no guarda datos de quien lo visita y no
autentica a nadie. La superficie es, por lo tanto, chica: el HTML publicado, el
JavaScript de los componentes interactivos y la configuración de despliegue.

Eso no la vuelve inexistente, y hay dos clases de problema que interesan por
igual.

## Qué reportar

### Problemas de seguridad

- Cualquier cosa que permita ejecutar código en el navegador de quien lee
- Dependencias con vulnerabilidades conocidas que lleguen al paquete publicado
- Fallas en la configuración de despliegue o en las cabeceras servidas
- Filtración de datos de quien visita hacia terceros

### Indicadores publicados sin defanguear

Esta es específica de este proyecto y se trata con la misma prioridad.

Los casos publican indicadores de compromiso, y todos tienen que salir
defangueados para que nadie los abra ni los copie por accidente. Hay un
verificador que lo comprueba sobre el HTML construido, y **un verificador
comprueba lo que mira, no lo que importa**: si encontrás un dominio o una
dirección clicleable que debería estar defangueada, es un hallazgo válido aunque
el build esté en verde.

Lo mismo vale al revés: si un caso sintético usa un dominio o un rango que
existe de verdad, en lugar de los que las RFC reservan para documentación.

### Errores de contenido

No son problemas de seguridad, y aun así son los más valiosos para un proyecto
educativo:

- Un dato mal citado, o una fuente que no dice lo que el caso le atribuye
- Una técnica de MITRE ATT&CK mal mapeada
- Una recomendación que en la práctica no funciona o es contraproducente

Se reportan por el mismo canal.

## Cómo reportar

El repositorio está en privado, así que el canal es el perfil de LinkedIn
enlazado en el encabezado del sitio:

https://www.linkedin.com/in/javiermapelli

Cuando el repositorio pase a público, el canal preferido va a ser el reporte
privado de vulnerabilidades de GitHub, que permite avisar sin exponer el
problema mientras se corrige.

**Sobre los tiempos, para no prometer lo que no puedo cumplir:** esto lo mantiene
una sola persona fuera de su horario de trabajo. No hay un compromiso de
respuesta en un plazo determinado. Los reportes se leen y se responden; los que
tocan indicadores publicados o ejecución de código tienen prioridad sobre el
resto.

## Qué esperar

- Confirmación de que el reporte se recibió
- Una respuesta sobre si se considera válido, y por qué si no lo es
- Crédito en el registro de cambios, salvo que prefieras lo contrario

## Fuera de alcance

- Resultados de escáneres automáticos sin una demostración de impacto
- Ausencia de cabeceras de seguridad que no aplican a un sitio estático sin
  sesiones ni formularios
- Que el sitio funcione sin JavaScript de manera degradada: es intencional, el
  contenido se lee igual
- Las direcciones IP y los dominios que aparecen en los casos sintéticos: salen
  de los rangos que las RFC 5737, 2606 y 5398 reservan para documentación y no
  pueden resolverse

## Uso responsable del material

Los casos describen técnicas de ataque con fines defensivos: entender cómo se
detecta cada una. El material no incluye código explotable ni infraestructura
utilizable, y las reconstrucciones de incidentes reales se basan en fuentes
públicas ya divulgadas.
