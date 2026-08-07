# Cómo contribuir

El repositorio está en privado por ahora y lo mantiene una sola persona. Este
archivo documenta cómo se trabaja acá, y sirve para dos cosas: para cuando el
repositorio se abra, y para que quien retome el proyecto —incluido mi yo futuro—
no tenga que reconstruir las reglas leyendo el código.

## Lo más útil que se puede aportar

**Una corrección de contenido.** Un dato mal citado, una fuente que no dice lo
que el caso le atribuye, una técnica de ATT&CK mal mapeada, una recomendación que
en la práctica no funciona. Es lo que más valor tiene en un proyecto educativo y
lo que más difícil es de detectar solo.

**Un desacuerdo con una lectura.** Varios casos toman posición sobre qué
significa una evidencia o qué control habría servido. Esas lecturas son
discutibles y están escritas en primera persona justamente para que se puedan
discutir.

## Las nueve invariantes

No se rompen. Si un aporte las contradice, se ajusta el aporte.

1. **Todo lo publicado está verificado por quien lo firma.** Ningún dato entra
   por recuerdo ni por confianza en un intermediario: o hay fuente primaria, o el
   caso dice que no la hay.
2. **Ningún indicador inventado.** Reproducible, o marcado como sintético; en los
   casos reales, citado. Para lo ficticio, los rangos y TLD que las RFC reservan
   para documentación.
3. **Indicadores defangueados** en el HTML publicado.
4. **Una página, un idioma**, resuelto en build desde la ruta.
5. **Ningún enlace interno escrito a mano.** Todos pasan por `withBase()`.
6. **Ningún marco de análisis sin datos reales para llenarlo.** Un diamante a
   medio completar enseña menos que su ausencia, y la ausencia se explica dentro
   del caso.
7. **Marcas en línea solo cuando el contraste es parte del argumento.** Una
   lista donde todos los renglones llevan la misma marca no está contrastando
   nada.
8. **La documentación de proceso vive fuera del repositorio.** Adentro, el README
   y THEMES.md, en voz descriptiva.
9. **La traducción va al final de cada caso.** Sin traducir no cuenta como
   terminado.

Las invariantes 3, 4 y 7 las verifican scripts y rompen el build. Las otras seis
dependen de que alguien las respete.

## Cómo se verifica

```bash
npm install
npm run build          # SIEMPRE antes de check
npm run check          # catálogo, defangueo, i18n, contraste, estilo
npm run check:idioma   # informa, no rompe
npm run audit:i18n     # informa, no rompe
```

**El orden no es negociable.** Dos de los cinco verificadores de `check` leen
`dist/` —el de defangueo y el de idioma— y son justo los que comprueban lo que
ve el lector. Sin `npm run build` previo revisan la compilación anterior **y dan
verde igual**. Pasó dos veces.

Si agregás un verificador: **no se estrena en verde.** Se prueba sembrando el
error que debería encontrar, se confirma que lo encuentra, y recién después se
restaura. Una herramienta que nunca falló no está probada, está sin usar.

## Anatomía de un caso

Cada caso son dos archivos con el mismo nombre, uno por idioma:

```
src/content/scenarios/es/17-nombre-del-caso.mdx
src/content/scenarios/en/17-nombre-del-caso.mdx
```

El prefijo numérico define la URL y tiene que coincidir con `caseNumber`. El
`caseId` se deriva de ese número como `soc-0NN`. El directorio padre define el
idioma. `tools/verificar-catalogo.mjs` comprueba las tres cosas, más que los
metadatos compartidos y las coordenadas del globo coincidan entre idiomas.

Toda isla dentro de un `.mdx` lleva `lang="<idioma>"`. Sin eso, el componente
renderiza su interfaz en el idioma por defecto dentro de una página que está en
el otro.

## Orden de trabajo de un caso

1. **Investigar primero.** Para los casos reales, hasta tener las fuentes
   primarias. Nada se escribe sobre lo que uno cree recordar.
2. **Escribir el español** y revisarlo en el navegador.
3. **Traducir al inglés** recién cuando el español está aprobado. Traducir antes
   significa traducir dos veces.
4. **Verificar** con la cadena completa.
5. **Commitear por capa**, un idioma por commit.

## Escritura

- Voz descriptiva, no imperativa dirigida al lector.
- Primera persona cuando se toma una posición discutible: "no incluyo el Diamond
  Model acá, porque...".
- Los números llevan su denominador. "2.412 registros" no dice nada; "2.412
  contra una mediana de 523 en el mismo período" dice todo.
- Cuando dos fuentes buenas discrepan, se anota la discrepancia en lugar de
  elegir en silencio.
- Cuando un dato no está verificado contra fuente primaria, se dice.

## Commits

Formato `tipo(alcance): descripción en minúscula`, en inglés, sin punto final.

```
feat(content): soc-017 título corto del caso
feat(content): english version of soc-017
fix(tools): descripción del arreglo
```

Un commit por capa. Los intentos fallidos y sus reversiones se dejan en el
historial: cuentan lo que pasó de verdad, que es más útil que un historial
prolijo que esconde un camino equivocado.

## Licencia de los aportes

El código se licencia bajo MIT y el contenido bajo CC BY 4.0. Al contribuir,
aceptás que tu aporte se publique bajo la licencia que corresponda a la parte que
tocaste.
