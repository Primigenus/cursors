fill = function(id, rand) {
  id = parseInt(id, 36);
  if (rand)
    id = id * rand;
  return (parseInt(id.toExponential().slice(2,-5), 10) & 0xFFFFFF).toString(16).toUpperCase();
}