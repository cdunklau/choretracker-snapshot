function setIntersection(s1, s2) {
  const intersection = new Set();
  for (const element of s1) {
    if (s2.has(element)) {
      intersection.add(element);
    }
  }
  return intersection;
}

function setUnion(s1, s2) {
  const union = new Set(s1);
  for (const element of s2) {
    union.add(element);
  }
  return union;
}

// Elements that are in s1 but not in s2
function setDifference(s1, s2) {
  const difference = new Set();
  for (const element of s1) {
    if ( ! s2.has(element) ) {
      difference.add(element)
    }
  }
  return difference;
}

export { setIntersection, setUnion, setDifference };
