// Katalogu i M'DON. Foto e secilit produkt: assets/img/produkte/<id>.jpg
window.MDON_DATA = {
  kategorite: {
    '':     { emri: 'Katalogu', pershkrimi: 'Të gjitha veshjet e M’DON, nga Malësia deri në Gjirokastër.' },
    burra:  { emri: 'Burra',    pershkrimi: 'Veshje për burra, të qepura me dorë: xhamadanë, jelekë dhe pallto leshi.' },
    gra:    { emri: 'Gra',      pershkrimi: 'Veshje për gra, me qëndismat e Malësisë dhe argjendin e Shkodrës.' },
    femije: { emri: 'Fëmijë',   pershkrimi: 'Trashëgimia jonë në masa të vogla: lesh i butë dhe qëndisje që zgjasin.' },
  },

  // Nga veriu në jug
  trevat: {
    malesia: 'Malësia',
    kukesi: 'Kukësi',
    shkodra: 'Shkodra',
    tirana: 'Tirana',
    korca: 'Korça',
    gjirokastra: 'Gjirokastra',
  },

  produkte: [
    // Burra
    { id: 'xhamadan-i-qendisur', emri: 'Xhamadan i qëndisur', kat: ['burra'], treva: 'malesia', materiali: 'Lesh', cmimi: 24900, shenja: 'Risi' },
    { id: 'xhamadan-klasik', emri: 'Xhamadan klasik', kat: ['burra'], treva: 'tirana', materiali: 'Lesh', cmimi: 21500 },
    { id: 'jelek-me-motiv-qilimi', emri: 'Jelek me motiv qilimi', kat: ['burra'], treva: 'kukesi', materiali: 'Lesh', cmimi: 14800, shenja: 'Risi' },
    { id: 'kemishe-liri', emri: 'Këmishë liri', kat: ['burra'], treva: 'korca', materiali: 'Li', cmimi: 9900 },
    { id: 'pantallona-leshi', emri: 'Pantallona leshi', kat: ['burra'], treva: 'malesia', materiali: 'Lesh', cmimi: 16500 },
    { id: 'kostum-i-zi', emri: 'Kostum i zi', kat: ['burra'], treva: 'korca', materiali: 'Lesh merino', cmimi: 42000 },
    { id: 'pallto-leshi-gri', emri: 'Pallto leshi gri', kat: ['burra'], treva: 'gjirokastra', materiali: 'Lesh', cmimi: 36000 },
    { id: 'kopsa-argjendi', emri: 'Kopsa argjendi për mansheta', kat: ['burra'], treva: 'shkodra', materiali: 'Argjend', cmimi: 11500, shenja: 'Seri e kufizuar', etiketa: 'Aksesorë' },


    // Gra
    { id: 'fustan-me-theke', emri: 'Fustan me thekë', kat: ['gra'], treva: 'malesia', materiali: 'Lesh', cmimi: 32500, shenja: 'Risi' },
    { id: 'pallto-me-motiv-qilimi', emri: 'Pallto me motiv qilimi', kat: ['gra'], treva: 'kukesi', materiali: 'Lesh', cmimi: 38000, shenja: 'Risi' },
    { id: 'fund-leshi-me-qendisje', emri: 'Fund leshi me qëndisje', kat: ['gra'], treva: 'malesia', materiali: 'Lesh', cmimi: 19800 },
    { id: 'kemishe-e-qendisur', emri: 'Këmishë e qëndisur', kat: ['gra'], treva: 'shkodra', materiali: 'Li', cmimi: 12400 },
    { id: 'vathe-filigrani', emri: 'Vathë filigrani', kat: ['gra'], treva: 'shkodra', materiali: 'Argjend', cmimi: 14200, shenja: 'Seri e kufizuar', etiketa: 'Aksesorë' },
    { id: 'jelek-kadifeje', emri: 'Jelek kadifeje', kat: ['gra'], treva: 'tirana', materiali: 'Kadife', cmimi: 17900 },
    { id: 'fustan-mbremjeje', emri: 'Fustan mbrëmjeje', kat: ['gra'], treva: 'korca', materiali: 'Mëndafsh', cmimi: 45000 },
    { id: 'shall-me-theke', emri: 'Shall me thekë', kat: ['gra'], treva: 'malesia', materiali: 'Lesh', cmimi: 8900 },
    { id: 'varese-argjendi', emri: 'Varëse argjendi', kat: ['gra'], treva: 'shkodra', materiali: 'Argjend', cmimi: 16800, etiketa: 'Aksesorë' },
    { id: 'xhakete-leshi', emri: 'Xhaketë leshi', kat: ['gra'], treva: 'gjirokastra', materiali: 'Lesh', cmimi: 27500 },

    // Fëmijë
    { id: 'jelek-i-qendisur', emri: 'Jelek i qëndisur', kat: ['femije'], treva: 'kukesi', materiali: 'Lesh', cmimi: 8400 },
    { id: 'fustan-i-vogel-me-theke', emri: 'Fustan i vogël me thekë', kat: ['femije'], treva: 'malesia', materiali: 'Lesh', cmimi: 11900, shenja: 'Risi' },
    { id: 'xhamadan-i-vogel', emri: 'Xhamadan i vogël', kat: ['femije'], treva: 'malesia', materiali: 'Lesh', cmimi: 10500 },
    { id: 'qeleshe-e-vogel', emri: 'Qeleshe e vogël', kat: ['femije'], treva: 'tirana', materiali: 'Lesh i shtypur', cmimi: 4200 },
    { id: 'kemishe-liri-femije', emri: 'Këmishë liri', kat: ['femije'], treva: 'korca', materiali: 'Li', cmimi: 5900 },
    { id: 'pulover-me-motiv-qilimi', emri: 'Pulovër me motiv qilimi', kat: ['femije'], treva: 'kukesi', materiali: 'Lesh', cmimi: 7800 },
    { id: 'pallto-e-vogel', emri: 'Pallto e vogël', kat: ['femije'], treva: 'gjirokastra', materiali: 'Lesh', cmimi: 14500 },
    { id: 'shall-i-vogel', emri: 'Shall i vogël', kat: ['femije'], treva: 'gjirokastra', materiali: 'Lesh', cmimi: 3900 },

    // Unisex (Burra dhe Gra)
    { id: 'qeleshe-e-bardhe', emri: 'Qeleshe e bardhë', kat: ['burra', 'gra'], treva: 'tirana', materiali: 'Lesh i shtypur', cmimi: 6800, etiketa: 'Unisex' },
    { id: 'shall-leshi', emri: 'Shall leshi', kat: ['burra', 'gra'], treva: 'gjirokastra', materiali: 'Lesh', cmimi: 7500, etiketa: 'Unisex' },
  ],
};
