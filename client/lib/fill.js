fill = function(id) {
  return (parseInt(parseInt(id, 36).toExponential().slice(2,-5), 10) & 0xFFFFFF).toString(16).toUpperCase();
}