// Übungsbibliothek: Anleitungen, Muskelgruppen und Posen für die SVG-Grafiken.
// Grafik-Koordinaten: viewBox 0 0 240 200, Boden bei y = 188, Winkel in Grad (0 = rechts, 90 = unten).

export const MUSCLES = {
  chest: 'Brust', frontDelt: 'Vordere Schulter', sideDelt: 'Seitliche Schulter', rearDelt: 'Hintere Schulter',
  biceps: 'Bizeps', triceps: 'Trizeps', forearms: 'Unterarme', abs: 'Bauch', obliques: 'Seitliche Bauchmuskeln',
  quads: 'Oberschenkel vorn (Quadrizeps)', adductors: 'Adduktoren', hamstrings: 'Oberschenkel hinten',
  glutes: 'Gesäß', calves: 'Waden', lats: 'Breiter Rückenmuskel (Latissimus)', traps: 'Trapezmuskel',
  upperBack: 'Oberer Rücken (Rhomboiden)', lowerBack: 'Unterer Rücken', hipflex: 'Hüftbeuger', heart: 'Herz-Kreislauf'
};

const STAND = { th: 90, sh: 90, ft: 0 };
const smith = (x) => ({ type: 'rail', x });
const towerR = { type: 'tower', x: 212 };

export const EXERCISES = {
  latziehen: {
    name: 'Latziehen', equipment: 'Kabelzug oben (ATX-Multipresse), Latzugstange',
    primary: ['lats', 'upperBack'], secondary: ['biceps', 'rearDelt'],
    start: 'Aufrecht sitzen, Oberschenkel unter dem Polster fixiert, Stange etwas breiter als schulterbreit greifen, Arme gestreckt.',
    steps: ['Brust heraus, Schulterblätter nach unten ziehen.', 'Stange kontrolliert zur oberen Brust ziehen, Ellbogen zeigen nach unten.', 'Langsam zurückführen, bis die Arme wieder gestreckt sind.'],
    mistakes: ['Mit Schwung aus dem Oberkörper ziehen', 'Stange in den Nacken ziehen', 'Schultern zu den Ohren hochziehen'],
    safety: ['Nur leichte Rücklage (ca. 10–15°)', 'Gewicht nicht unkontrolliert nach oben schnellen lassen'],
    figure: {
      view: 'side', highlight: ['lats', 'upperback', 'biceps'],
      equipment: [
        { type: 'stack', x: 212 }, { type: 'cable', path: [[118, 14], [212, 14], [212, 120]], to: null },
        { type: 'cable', path: [[118, 14]], to: 'hand0' }, { type: 'pulley', at: [118, 14] }, { type: 'pulley', at: [212, 14] },
        { type: 'seat', x1: 82, x2: 126, y: 148 }, { type: 'pad', at: [144, 129], r: 6 },
        { type: 'lbar', at: 'hand0' }
      ],
      startPose: { hip: [100, 141], torso: -100, arms: [{ to: [116, 32], bend: -1 }], legs: [{ th: 0, sh: 90, ft: 0 }] },
      endPose: { hip: [100, 141], torso: -105, arms: [{ to: [108, 74], bend: -1 }], legs: [{ th: 0, sh: 90, ft: 0 }] },
      arrows: [{ from: 'hand0', off: [16, 0], bend: 0 }]
    }
  },
  kabelrudern: {
    name: 'Kabelrudern (sitzend)', equipment: 'Kabelzug unten, Ruderbank, V-Griff',
    primary: ['lats', 'upperBack'], secondary: ['biceps', 'rearDelt', 'lowerBack'],
    start: 'Aufrecht sitzen, Füße an der Fußplatte, Knie leicht gebeugt, Griff mit gestreckten Armen halten.',
    steps: ['Oberkörper aufrecht stabilisieren.', 'Griff zum Bauchnabel ziehen, Ellbogen eng nach hinten führen.', 'Schulterblätter zusammenführen, dann langsam nach vorn strecken.'],
    mistakes: ['Rundrücken beim Vorbeugen', 'Starkes Schaukeln mit dem Oberkörper', 'Ellbogen weit abspreizen'],
    safety: ['Wirbelsäule neutral halten', 'Gewicht am Ende kontrolliert absenken'],
    figure: {
      view: 'side', highlight: ['lats', 'upperback', 'biceps'],
      equipment: [
        towerR, { type: 'pulley', at: [206, 160] }, { type: 'cable', path: [[206, 160]], to: 'hand0' },
        { type: 'bench', x1: 52, x2: 118, y: 160 }, { type: 'plate', x: 174, y1: 150, y2: 188 }, { type: 'handle', at: 'hand0' }
      ],
      startPose: { hip: [90, 152], torso: -74, arms: [{ to: [154, 124], bend: 1 }], legs: [{ ankle: [164, 170], bend: -1, ft: -70 }] },
      endPose: { hip: [90, 152], torso: -96, arms: [{ to: [108, 126], bend: 1 }], legs: [{ ankle: [164, 170], bend: -1, ft: -70 }] },
      arrows: [{ from: 'hand0', off: [0, -12], bend: 0 }]
    }
  },
  reverseflys: {
    name: 'Reverse Flys (Kabel)', equipment: 'Zwei Kabelzüge auf Schulterhöhe (überkreuzt gegriffen)',
    primary: ['rearDelt', 'upperBack'], secondary: ['traps'],
    start: 'Mittig zwischen den Kabelzügen stehen, Kabel überkreuzt greifen, Arme auf Schulterhöhe vor dem Körper.',
    steps: ['Ellbogen minimal beugen und fixieren.', 'Arme in einem Bogen seitlich nach außen ziehen, bis sie auf Körperlinie sind.', 'Langsam zurück vor den Körper führen.'],
    mistakes: ['Ellbogenwinkel während der Bewegung verändern', 'Schultern hochziehen', 'Zu schweres Gewicht mit Schwung'],
    safety: ['Leichtes Gewicht, saubere Endposition halten', 'Rumpf stabil, kein Hohlkreuz'],
    figure: {
      view: 'back', armsBehind: 'start', highlight: ['delt', 'upperback', 'traps'],
      equipment: [
        { type: 'tower', x: 14 }, { type: 'tower', x: 226 },
        { type: 'pulley', at: [22, 52] }, { type: 'pulley', at: [218, 52] },
        { type: 'cable', path: [[22, 52]], to: 'hand1' }, { type: 'cable', path: [[218, 52]], to: 'hand0' }
      ],
      startPose: { hip: [120, 103], torso: -90, arms: [{ to: [128, 56], straight: true }, { to: [112, 56], straight: true }],
        legs: [{ ankle: [110, 186] }, { ankle: [130, 186] }] },
      endPose: { hip: [120, 103], torso: -90, arms: [{ to: [52, 58], straight: true }, { to: [188, 58], straight: true }],
        legs: [{ ankle: [110, 186] }, { ankle: [130, 186] }] },
      arrows: [{ from: 'hand0', off: [0, -14], bend: -10 }, { from: 'hand1', off: [0, -14], bend: 10 }]
    }
  },
  bizepscurls: {
    name: 'Bizepscurls', equipment: 'Kurzhanteln (alternativ Kabelzug unten)',
    primary: ['biceps'], secondary: ['forearms'],
    start: 'Aufrecht stehen, Kurzhanteln mit Untergriff (Handflächen nach vorn), Arme gestreckt.',
    steps: ['Oberarme fest am Körper fixieren.', 'Hanteln durch Beugen im Ellbogen zur Schulter führen.', 'Kontrolliert und vollständig absenken.'],
    mistakes: ['Schwung aus dem Rücken', 'Ellbogen wandern nach vorn', 'Nur halbe Bewegungsamplitude'],
    safety: ['Knie leicht gebeugt, Bauch angespannt', 'Handgelenke gerade halten'],
    figure: {
      view: 'side', highlight: ['biceps', 'forearm'],
      equipment: [{ type: 'dumbbell', at: 'hand0', mode: 'end' }],
      startPose: { hip: [115, 103], torso: -90, arms: [{ ua: 92, fa: 92 }], legs: [STAND] },
      endPose: { hip: [115, 103], torso: -90, arms: [{ ua: 95, fa: -62 }], legs: [STAND] },
      arrows: [{ from: 'hand0', off: [14, 0], bend: -22 }]
    }
  },
  bankdruecken: {
    name: 'Bankdrücken', equipment: 'Multipresse (Langhantel) und Flachbank',
    primary: ['chest'], secondary: ['frontDelt', 'triceps'],
    start: 'Rückenlage auf der Flachbank, Füße fest am Boden, Stange etwas breiter als schulterbreit über der Brust.',
    steps: ['Schulterblätter zusammen- und nach unten ziehen.', 'Stange kontrolliert zur unteren Brust absenken.', 'Kraftvoll nach oben drücken, ohne die Ellbogen zu überstrecken.'],
    mistakes: ['Stange auf der Brust abfedern', 'Gesäß hebt von der Bank ab', 'Ellbogen 90° abgespreizt'],
    safety: ['Sicherheitshaken der Multipresse auf Brusthöhe einstellen', 'Ellbogen ca. 45–70° zum Körper'],
    figure: {
      view: 'side', highlight: ['chest', 'delt', 'triceps'],
      equipment: [smith(102), { type: 'bench', x1: 52, x2: 166, y: 132 }, { type: 'barbell', at: 'hand0', r: 15 }],
      startPose: { hip: [152, 124], torso: 180, neck: 180, arms: [{ to: [102, 72], bend: -1 }], legs: [{ ankle: [186, 184], bend: -1, ft: 0 }] },
      endPose: { hip: [152, 124], torso: 180, neck: 180, arms: [{ to: [102, 106], bend: -1 }], legs: [{ ankle: [186, 184], bend: -1, ft: 0 }] },
      arrows: [{ from: 'hand0', off: [24, 0], bend: 0, reverse: true }]
    }
  },
  schraegbank: {
    name: 'Schrägbankdrücken', equipment: 'Multipresse (Langhantel), Schrägbank 30–45°',
    primary: ['chest'], secondary: ['frontDelt', 'triceps'],
    start: 'Auf der Schrägbank (30–45°) liegen, Füße am Boden, Stange über der oberen Brust.',
    steps: ['Schulterblätter fixieren, Brust heraus.', 'Stange zur oberen Brust unterhalb des Schlüsselbeins senken.', 'Senkrecht nach oben drücken.'],
    mistakes: ['Bank zu steil (wird zum Schulterdrücken)', 'Hohlkreuz', 'Stange springt von der Brust'],
    safety: ['Sicherheitshaken einstellen', 'Kontrollierte Absenkphase (2–3 s)'],
    figure: {
      view: 'side', highlight: ['chest', 'delt', 'triceps'],
      equipment: [smith(106), { type: 'incline', a: [150, 146], b: [86, 92], seat: [130, 172, 150] }, { type: 'barbell', at: 'hand0', r: 15 }],
      startPose: { hip: [142, 140], torso: -142, arms: [{ to: [106, 52], bend: -1 }], legs: [{ ankle: [184, 184], bend: -1, ft: 0 }] },
      endPose: { hip: [142, 140], torso: -142, arms: [{ to: [106, 88], bend: -1 }], legs: [{ ankle: [184, 184], bend: -1, ft: 0 }] },
      arrows: [{ from: 'hand0', off: [24, 0], bend: 0, reverse: true }]
    }
  },
  seitheben: {
    name: 'Seitheben', equipment: 'Kurzhanteln (alternativ Kabelzug unten)',
    primary: ['sideDelt'], secondary: ['traps', 'frontDelt'],
    start: 'Aufrecht stehen, Kurzhanteln seitlich neben den Oberschenkeln, Ellbogen leicht gebeugt.',
    steps: ['Arme seitlich in einem Bogen anheben.', 'Bis etwa Schulterhöhe führen, Ellbogen führen die Bewegung.', 'Langsam absenken.'],
    mistakes: ['Mit Schwung arbeiten', 'Schultern zu den Ohren ziehen', 'Hände höher als Ellbogen'],
    safety: ['Leichte Gewichte und hohe Wiederholungen', 'Nicht deutlich über Schulterhöhe heben'],
    figure: {
      view: 'front', highlight: ['delt'],
      equipment: [{ type: 'dumbbell', at: 'hand0', mode: 'end' }, { type: 'dumbbell', at: 'hand1', mode: 'end' }],
      startPose: { hip: [120, 103], torso: -90, arms: [{ to: [96, 100], straight: true }, { to: [144, 100], straight: true }],
        legs: [{ ankle: [110, 186] }, { ankle: [130, 186] }] },
      endPose: { hip: [120, 103], torso: -90, arms: [{ to: [50, 58], straight: true }, { to: [190, 58], straight: true }],
        legs: [{ ankle: [110, 186] }, { ankle: [130, 186] }] },
      arrows: [{ from: 'hand0', off: [-6, 6], bend: 14 }, { from: 'hand1', off: [6, 6], bend: -14 }]
    }
  },
  trizepsdruecken: {
    name: 'Trizepsdrücken (Kabel)', equipment: 'Kabelzug oben, Seil oder gerade Stange',
    primary: ['triceps'], secondary: [],
    start: 'Vor dem Kabelzug stehen, Oberkörper leicht nach vorn, Ellbogen seitlich am Körper, Unterarme waagerecht.',
    steps: ['Oberarme fixieren.', 'Griff nach unten drücken, bis die Arme gestreckt sind.', 'Langsam bis knapp über Waagerecht zurückführen.'],
    mistakes: ['Ellbogen bewegen sich nach vorn', 'Körpergewicht hineinlehnen', 'Schultern rollen nach vorn'],
    safety: ['Handgelenke neutral halten', 'Kontrollierte Rückführung'],
    figure: {
      view: 'side', highlight: ['triceps'],
      equipment: [{ type: 'stack', x: 212 }, { type: 'pulley', at: [178, 22] }, { type: 'cable', path: [[212, 22], [178, 22]], to: null },
        { type: 'cable', path: [[178, 22]], to: 'hand0' }, { type: 'rope', at: 'hand0' }],
      startPose: { hip: [128, 103], torso: -82, arms: [{ to: [160, 72], bend: -1 }], legs: [STAND] },
      endPose: { hip: [128, 103], torso: -82, arms: [{ to: [145, 106], bend: -1 }], legs: [STAND] },
      arrows: [{ from: 'hand0', off: [16, 0], bend: -10 }]
    }
  },
  kniebeugen: {
    name: 'Kniebeugen', equipment: 'Multipresse oder Langhantel im Rack',
    primary: ['quads', 'glutes'], secondary: ['adductors', 'lowerBack'],
    start: 'Stange auf dem oberen Rücken (nicht Nacken), Füße schulterbreit, Fußspitzen leicht nach außen.',
    steps: ['Hüfte nach hinten-unten senken, Knie folgen den Fußspitzen.', 'Bis mindestens Oberschenkel waagerecht absenken.', 'Über die ganze Fußsohle kraftvoll hochdrücken.'],
    mistakes: ['Knie fallen nach innen', 'Fersen heben ab', 'Rundrücken am tiefsten Punkt'],
    safety: ['Sicherheitshaken knapp unter tiefstem Punkt', 'Rumpf vor jeder Wiederholung anspannen'],
    figure: {
      view: 'side', highlight: ['quads', 'glutes'],
      equipment: [smith(112), { type: 'barbell', at: 'traps', r: 16 }],
      startPose: { hip: [116, 102], torso: -88, arms: [{ rel: 'shoulder', f: -20, u: -1, bend: -1 }], legs: [{ ankle: [120, 184], bend: -1, ft: 0 }] },
      endPose: { hip: [86, 138], torso: -52, arms: [{ rel: 'shoulder', f: -20, u: -1, bend: -1 }], legs: [{ ankle: [120, 184], bend: -1, ft: 0 }] },
      arrows: [{ from: 'hip', off: [-18, 0], bend: 10 }]
    }
  },
  rdl: {
    name: 'Rumänisches Kreuzheben', equipment: 'Langhantel (alternativ Kurzhanteln)',
    primary: ['hamstrings', 'glutes'], secondary: ['lowerBack', 'forearms'],
    start: 'Hüftbreit stehen, Langhantel im Obergriff vor den Oberschenkeln, Knie leicht gebeugt.',
    steps: ['Hüfte weit nach hinten schieben, Rücken bleibt gerade.', 'Stange dicht an den Beinen bis knapp unter die Knie senken.', 'Hüfte nach vorn bringen und aufrichten.'],
    mistakes: ['Rundrücken', 'Stange entfernt sich von den Beinen', 'Zu starke Kniebeugung (wird zur Kniebeuge)'],
    safety: ['Bewegung endet, wenn der Rücken nicht mehr gerade bleibt', 'Nacken neutral'],
    figure: {
      view: 'side', highlight: ['hams', 'glutes', 'lowerback'],
      equipment: [{ type: 'barbell', at: 'hand0', r: 13 }],
      startPose: { hip: [118, 103], torso: -88, arms: [{ ua: 92, fa: 91 }], legs: [{ ankle: [120, 184], bend: -1, ft: 0 }] },
      endPose: { hip: [88, 110], torso: -30, arms: [{ ua: 92, fa: 90 }], legs: [{ ankle: [120, 184], bend: -1, ft: 0 }] },
      arrows: [{ from: 'hip', off: [-14, -8], bend: -6 }]
    }
  },
  wadenheben: {
    name: 'Wadenheben (stehend)', equipment: 'Multipresse, Stufe/Hantelscheibe als Erhöhung',
    primary: ['calves'], secondary: [],
    start: 'Fußballen auf der Erhöhung, Fersen frei, Stange auf dem oberen Rücken, Knie fast gestreckt.',
    steps: ['Fersen tief absenken (Dehnung).', 'Auf die Zehenspitzen drücken, oben 1 s halten.', 'Langsam wieder absenken.'],
    mistakes: ['Wippen ohne volle Bewegung', 'Knie beugen und strecken', 'Zu schnelle Wiederholungen'],
    safety: ['Sicherer Stand auf der Stufe', 'Sicherheitshaken der Multipresse nutzen'],
    figure: {
      view: 'side', highlight: ['calves'],
      equipment: [smith(118), { type: 'box', x: 118, y: 179, w: 44, h: 9 }, { type: 'barbell', at: 'traps', r: 16 }],
      startPose: { hip: [125, 102], torso: -90, arms: [{ rel: 'shoulder', f: -20, u: -1, bend: -1 }], legs: [{ ball: [139, 179], ft: -25 }] },
      endPose: { hip: [127, 88], torso: -90, arms: [{ rel: 'shoulder', f: -20, u: -1, bend: -1 }], legs: [{ ball: [139, 179], ft: 42 }] },
      arrows: [{ from: 'ankle0', off: [-14, 0], bend: 0 }]
    }
  },
  kabelcrunch: {
    name: 'Kabelcrunches', equipment: 'Kabelzug oben, Seil',
    primary: ['abs'], secondary: ['obliques'],
    start: 'Vor dem Kabelzug knien, Seil seitlich am Kopf halten, Hüfte über den Knien.',
    steps: ['Hüfte bleibt fixiert.', 'Oberkörper einrollen: Brust Richtung Becken ziehen.', 'Langsam wieder aufrichten.'],
    mistakes: ['Mit Armen ziehen', 'Hüfte setzt sich nach hinten', 'Nur Vorbeugen ohne Einrollen'],
    safety: ['Moderates Gewicht', 'Nacken entspannt, Kinn leicht zur Brust'],
    figure: {
      view: 'side', highlight: ['abs'],
      equipment: [{ type: 'stack', x: 212 }, { type: 'pulley', at: [190, 24] }, { type: 'cable', path: [[212, 24], [190, 24]], to: null },
        { type: 'cable', path: [[190, 24]], to: 'hand0' }, { type: 'mat', x1: 40, x2: 170 }],
      startPose: { hip: [116, 141], torso: -82, arms: [{ rel: 'head', f: 10, u: -2, bend: -1 }], legs: [{ th: 92, sh: 180, ft: 100 }] },
      endPose: { hip: [106, 145], torso: 18, curl: 12, arms: [{ rel: 'head', f: 10, u: -2, bend: -1 }], legs: [{ th: 100, sh: 180, ft: 100 }] },
      arrows: [{ from: 'head', off: [0, -16], bend: -18 }]
    }
  },
  klimmzuege: {
    name: 'Klimmzüge / Latziehen', equipment: 'Klimmzugstange (alternativ Latzug)',
    primary: ['lats', 'upperBack'], secondary: ['biceps', 'forearms'],
    start: 'An der Stange hängen, Griff etwas breiter als schulterbreit, Arme gestreckt, Schultern aktiv.',
    steps: ['Schulterblätter nach unten ziehen.', 'Brust zur Stange ziehen, bis das Kinn über der Stange ist.', 'Kontrolliert bis zur vollen Streckung ablassen.'],
    mistakes: ['Schwingen (Kipping)', 'Halbe Wiederholungen', 'Kinn reckt nach vorn'],
    safety: ['Bei zu wenig Kraft: Latziehen oder Band-Unterstützung', 'Nicht aus voller Höhe fallen lassen'],
    figure: {
      view: 'side', highlight: ['lats', 'upperback', 'biceps'],
      equipment: [{ type: 'pullbar', at: [130, 16], to: 214 }],
      startPose: { hip: [124, 128], torso: -92, arms: [{ to: [130, 16], bend: 1 }], legs: [{ th: 108, sh: 172, ft: 100 }] },
      endPose: { hip: [118, 92], torso: -94, arms: [{ to: [130, 16], bend: 1 }], legs: [{ th: 108, sh: 172, ft: 100 }] },
      arrows: [{ from: 'shoulder', off: [-22, 0], bend: 0 }]
    }
  },
  einarmrudern: {
    name: 'Einarmiges Kabelrudern', equipment: 'Kabelzug mittlere Höhe, Einhandgriff',
    primary: ['lats', 'upperBack'], secondary: ['biceps', 'rearDelt'],
    start: 'Schrittstellung vor dem Kabelzug, Oberkörper leicht vorgeneigt, Griff mit gestrecktem Arm.',
    steps: ['Rumpf stabil, Hüfte zeigt nach vorn.', 'Ellbogen dicht am Körper nach hinten zur Hüfte ziehen.', 'Arm langsam strecken und Schulterblatt nach vorn gleiten lassen.'],
    mistakes: ['Oberkörper verdreht stark', 'Schulter zieht zum Ohr', 'Zu kurze Bewegung'],
    safety: ['Freie Hand am Oberschenkel abstützen', 'Seiten gleich oft trainieren'],
    figure: {
      view: 'side', highlight: ['lats', 'upperback', 'biceps'],
      equipment: [towerR, { type: 'pulley', at: [206, 82] }, { type: 'cable', path: [[206, 82]], to: 'hand0' }, { type: 'handle', at: 'hand0' }],
      startPose: { hip: [112, 106], torso: -70, arms: [{ to: [184, 74], bend: 1 }, { ua: 74, fa: 40 }],
        legs: [{ ankle: [146, 184], bend: -1, ft: 0 }, { ankle: [84, 184], bend: -1, ft: 0 }] },
      endPose: { hip: [112, 106], torso: -74, arms: [{ to: [126, 86], bend: 1 }, { ua: 74, fa: 40 }],
        legs: [{ ankle: [146, 184], bend: -1, ft: 0 }, { ankle: [84, 184], bend: -1, ft: 0 }] },
      arrows: [{ from: 'hand0', off: [0, -14], bend: 0 }]
    }
  },
  facepulls: {
    name: 'Face Pulls', equipment: 'Kabelzug auf Kopfhöhe, Seil',
    primary: ['rearDelt', 'upperBack'], secondary: ['traps'],
    start: 'Vor dem Kabelzug stehen, Seil mit Neutralgriff auf Augenhöhe, Arme gestreckt.',
    steps: ['Seil Richtung Stirn ziehen, Ellbogen hoch und weit nach außen.', 'Hände am Ende neben den Ohren, Schulterblätter zusammen.', 'Kontrolliert zurück.'],
    mistakes: ['Ellbogen sinken ab', 'Hohlkreuz zum Ziehen', 'Zu schweres Gewicht'],
    safety: ['Leichtes Gewicht, Fokus auf Außenrotation', 'Bauch angespannt'],
    figure: {
      view: 'side', highlight: ['delt', 'upperback'],
      equipment: [{ type: 'stack', x: 212 }, { type: 'pulley', at: [206, 40] }, { type: 'cable', path: [[206, 40]], to: 'hand0' }, { type: 'rope', at: 'hand0' }],
      startPose: { hip: [112, 104], torso: -93, arms: [{ to: [164, 40], bend: -1 }], legs: [{ ankle: [126, 184], bend: -1 }, { ankle: [100, 184], bend: -1 }] },
      endPose: { hip: [112, 104], torso: -95, arms: [{ to: [122, 30], bend: -1 }], legs: [{ ankle: [126, 184], bend: -1 }, { ankle: [100, 184], bend: -1 }] },
      arrows: [{ from: 'hand0', off: [0, -12], bend: 0 }]
    }
  },
  hammercurls: {
    name: 'Hammer Curls', equipment: 'Kurzhanteln',
    primary: ['biceps', 'forearms'], secondary: [],
    start: 'Aufrecht stehen, Kurzhanteln im Neutralgriff (Daumen nach vorn) neben dem Körper.',
    steps: ['Oberarme am Körper fixieren.', 'Hanteln im Neutralgriff zur Schulter beugen.', 'Langsam vollständig absenken.'],
    mistakes: ['Schwung aus dem Körper', 'Handgelenke knicken ab', 'Ellbogen wandern nach vorn'],
    safety: ['Abwechselnd oder beidseitig mit kontrolliertem Tempo', 'Rumpf stabil'],
    figure: {
      view: 'side', highlight: ['biceps', 'forearm'],
      equipment: [{ type: 'dumbbell', at: 'hand0', mode: 'side' }],
      startPose: { hip: [115, 103], torso: -90, arms: [{ ua: 92, fa: 92 }], legs: [STAND] },
      endPose: { hip: [115, 103], torso: -90, arms: [{ ua: 95, fa: -62 }], legs: [STAND] },
      arrows: [{ from: 'hand0', off: [16, 0], bend: -22 }]
    }
  },
  schulterdruecken: {
    name: 'Schulterdrücken (sitzend)', equipment: 'Multipresse, Bank mit senkrechter Lehne',
    primary: ['frontDelt', 'sideDelt'], secondary: ['triceps', 'traps'],
    start: 'Aufrecht sitzen, Rücken an der Lehne, Stange auf Höhe des Kinns, Unterarme senkrecht.',
    steps: ['Bauch und Gesäß anspannen.', 'Stange senkrecht über den Kopf drücken.', 'Kontrolliert bis Kinnhöhe absenken.'],
    mistakes: ['Starkes Hohlkreuz', 'Ellbogen zeigen nach hinten', 'Stange zu tief in den Nacken'],
    safety: ['Sicherheitshaken auf Kinnhöhe einstellen', 'Kopf beim Absenken minimal zurück'],
    figure: {
      view: 'side', highlight: ['delt', 'triceps'],
      equipment: [smith(114), { type: 'chair', x1: 92, x2: 132, y: 148, backX: 90, backTop: 74 }, { type: 'barbell', at: 'hand0', r: 15 }],
      startPose: { hip: [104, 141], torso: -90, arms: [{ to: [114, 80], bend: 1 }], legs: [{ th: 0, sh: 90, ft: 0 }] },
      endPose: { hip: [104, 141], torso: -90, arms: [{ to: [114, 32], bend: 1 }], legs: [{ th: 0, sh: 90, ft: 0 }] },
      arrows: [{ from: 'hand0', off: [24, 0], bend: 0 }]
    }
  },
  cableflys: {
    name: 'Cable Flys', equipment: 'Zwei Kabelzüge oben (Kabelzugstation)',
    primary: ['chest'], secondary: ['frontDelt'],
    start: 'Mittig zwischen den Kabelzügen, leichte Schrittstellung, Arme seitlich ausgebreitet, Ellbogen leicht gebeugt.',
    steps: ['Ellbogenwinkel fixieren.', 'Hände in einem Bogen nach vorn-unten vor dem Körper zusammenführen.', 'Langsam bis zur Dehnung der Brust öffnen.'],
    mistakes: ['Arme beugen und drücken statt Bogen', 'Schultern rollen nach vorn', 'Zu weite Öffnung'],
    safety: ['Dehnung nur bis Körperlinie', 'Moderates Gewicht'],
    figure: {
      view: 'front', highlight: ['chest', 'delt'],
      equipment: [{ type: 'tower', x: 14 }, { type: 'tower', x: 226 }, { type: 'pulley', at: [22, 26] }, { type: 'pulley', at: [218, 26] },
        { type: 'cable', path: [[22, 26]], to: 'hand0' }, { type: 'cable', path: [[218, 26]], to: 'hand1' }],
      startPose: { hip: [120, 103], torso: -90, arms: [{ to: [52, 62], bend: -1 }, { to: [188, 62], bend: 1 }],
        legs: [{ ankle: [110, 186] }, { ankle: [130, 186] }] },
      endPose: { hip: [120, 103], torso: -90, arms: [{ to: [116, 86], straight: true }, { to: [124, 86], straight: true }],
        legs: [{ ankle: [110, 186] }, { ankle: [130, 186] }] },
      arrows: [{ from: 'hand0', off: [0, 12], bend: 10 }, { from: 'hand1', off: [0, 12], bend: -10 }]
    }
  },
  trizepsstrecken: {
    name: 'Trizepsstrecken über Kopf', equipment: 'Kabelzug, Seil (vom Gerät abgewandt)',
    primary: ['triceps'], secondary: [],
    start: 'Mit dem Rücken zum Kabelzug in Schrittstellung, Seil hinter dem Kopf, Oberarme neben dem Kopf.',
    steps: ['Oberarme fixieren, Ellbogen zeigen nach vorn.', 'Unterarme nach vorn-oben strecken.', 'Langsam hinter den Kopf zurückführen.'],
    mistakes: ['Ellbogen spreizen weit ab', 'Oberarme bewegen mit', 'Hohlkreuz'],
    safety: ['Rumpf fest, leichte Vorlage', 'Volle Dehnung nur ohne Schulterschmerz'],
    figure: {
      view: 'side', highlight: ['triceps'],
      equipment: [{ type: 'stack', x: 26 }, { type: 'pulley', at: [34, 66] }, { type: 'cable', path: [[34, 66]], to: 'hand0' }, { type: 'rope', at: 'hand0' }],
      startPose: { hip: [120, 104], torso: -56, arms: [{ ua: -52, fa: 165 }], legs: [{ ankle: [154, 184], bend: -1 }, { ankle: [98, 184], bend: -1 }] },
      endPose: { hip: [120, 104], torso: -56, arms: [{ ua: -52, fa: 308 }], legs: [{ ankle: [154, 184], bend: -1 }, { ankle: [98, 184], bend: -1 }] },
      arrows: [{ from: 'hand0', off: [6, -8], bend: -16 }]
    }
  },
  bulgarian: {
    name: 'Bulgarian Split Squats', equipment: 'Hantelbank, Kurzhanteln',
    primary: ['quads', 'glutes'], secondary: ['adductors', 'hamstrings'],
    start: 'Rückwärtiger Fußrücken auf der Bank, vorderer Fuß ca. 60–80 cm vor der Bank, Hanteln seitlich.',
    steps: ['Oberkörper aufrecht, leicht vorgeneigt.', 'Senkrecht absenken, bis das hintere Knie fast den Boden berührt.', 'Über die vordere Ferse hochdrücken.'],
    mistakes: ['Vorderes Knie fällt nach innen', 'Schritt zu kurz', 'Gewicht auf dem hinteren Bein'],
    safety: ['Zuerst ohne Gewicht Balance finden', 'Beide Seiten gleich trainieren'],
    figure: {
      view: 'side', highlight: ['quads0', 'glutes'],
      equipment: [{ type: 'bench', x1: 22, x2: 80, y: 140 }, { type: 'dumbbell', at: 'hand0', mode: 'end' }],
      startPose: { hip: [114, 106], torso: -86, arms: [{ ua: 92, fa: 91 }], legs: [{ ankle: [140, 184], bend: -1, ft: 0 }, { ankle: [64, 134], bend: 1, ft: 178 }] },
      endPose: { hip: [106, 140], torso: -80, arms: [{ ua: 92, fa: 91 }], legs: [{ ankle: [140, 184], bend: -1, ft: 0 }, { ankle: [64, 134], bend: 1, ft: 178 }] },
      arrows: [{ from: 'hip', off: [-22, -10], bend: 0 }]
    }
  },
  beinbeugen: {
    name: 'Beinbeugen am Kabel', equipment: 'Kabelzug unten, Fußschlaufe',
    primary: ['hamstrings'], secondary: ['calves'],
    start: 'Mit Blick zum Kabelzug stehen, Schlaufe am Knöchel, mit den Händen am Gerät festhalten.',
    steps: ['Oberschenkel des Arbeitsbeins bleibt senkrecht.', 'Ferse Richtung Gesäß beugen.', 'Langsam vollständig strecken.'],
    mistakes: ['Hüfte beugt mit', 'Schwung aus dem Standbein', 'Hohlkreuz'],
    safety: ['Sicherer Halt am Gerät', 'Kontrolliertes Tempo'],
    figure: {
      view: 'side', highlight: ['hams0'],
      equipment: [towerR, { type: 'pulley', at: [206, 180] }, { type: 'cable', path: [[206, 180]], to: 'ankle0' }, { type: 'strap', at: 'ankle0' }],
      startPose: { hip: [146, 104], torso: -80, arms: [{ to: [204, 86], bend: 1 }],
        legs: [{ th: 98, sh: 104, ft: 20 }, { ankle: [148, 184], bend: -1, ft: 0 }] },
      endPose: { hip: [146, 104], torso: -80, arms: [{ to: [204, 86], bend: 1 }],
        legs: [{ th: 100, sh: 196, ft: 120 }, { ankle: [148, 184], bend: -1, ft: 0 }] },
      arrows: [{ from: 'ankle0', off: [-6, 10], bend: 16 }]
    }
  },
  fersenkniebeugen: {
    name: 'Kniebeugen mit erhöhten Fersen', equipment: 'Kurzhantel (Goblet), Hantelscheibe/Keil unter den Fersen',
    primary: ['quads'], secondary: ['glutes', 'adductors'],
    start: 'Fersen auf einer flachen Erhöhung, Kurzhantel senkrecht vor der Brust, Füße hüftbreit.',
    steps: ['Oberkörper möglichst aufrecht.', 'Tief absenken, Knie dürfen weit nach vorn.', 'Gleichmäßig hochdrücken.'],
    mistakes: ['Oberkörper kippt nach vorn', 'Knie fallen nach innen', 'Fersen rutschen von der Erhöhung'],
    safety: ['Stabile Unterlage nutzen', 'Tiefe nur so weit, wie der Rücken gerade bleibt'],
    figure: {
      view: 'side', highlight: ['quads', 'glutes'],
      equipment: [{ type: 'wedge', x: 108, y: 188, w: 30, h: 10 }, { type: 'dumbbell', at: 'hand0', mode: 'side', rot: 90 }],
      startPose: { hip: [118, 98], torso: -88, arms: [{ rel: 'shoulder', f: 12, u: -16, bend: 1 }], legs: [{ ankle: [120, 177], bend: -1, ft: 22 }] },
      endPose: { hip: [100, 140], torso: -70, arms: [{ rel: 'shoulder', f: 12, u: -16, bend: 1 }], legs: [{ ankle: [120, 177], bend: -1, ft: 22 }] },
      arrows: [{ from: 'hip', off: [-18, 0], bend: 0 }]
    }
  },
  ausdauer: {
    name: 'Leichtes Ausdauertraining', equipment: 'Ergometer, Laufband oder zügiges Gehen',
    primary: ['heart', 'quads'], secondary: ['glutes', 'calves'],
    start: 'Ergometer einstellen: Sattel so hoch, dass das Knie unten leicht gebeugt bleibt.',
    steps: ['Locker einfahren (3–5 min).', 'Gleichmäßiges Tempo: Unterhaltung muss möglich sein.', 'Letzte Minuten langsam ausrollen.'],
    mistakes: ['Zu hohe Intensität am Ruhetag', 'Sattel zu tief'],
    safety: ['Bei Schwindel oder Brustschmerz sofort abbrechen', 'Ausreichend trinken'],
    figure: {
      view: 'side', highlight: ['quads', 'calves'],
      equipment: [{ type: 'bike', saddle: [100, 114], crank: [130, 160], bar: [156, 96] }],
      startPose: { hip: [100, 108], torso: -66, arms: [{ to: [156, 96], bend: 1 }],
        legs: [{ crank: [130, 160], r: 16, a: 0, bend: -1, ft: 10 }, { crank: [130, 160], r: 16, a: 180, bend: -1, ft: 10 }] },
      endPose: { hip: [100, 108], torso: -66, arms: [{ to: [156, 96], bend: 1 }],
        legs: [{ crank: [130, 160], r: 16, a: 180, bend: -1, ft: 10 }, { crank: [130, 160], r: 16, a: 360, bend: -1, ft: 10 }] },
      arrows: [{ from: 'ankle0', off: [0, 0], bend: -34 }]
    }
  },
  mobilitaet: {
    name: 'Mobilität: Hüftbeuger-Dehnung', equipment: 'Matte',
    primary: ['hipflex', 'quads'], secondary: ['abs', 'lats'],
    start: 'Halbkniestand: hinteres Knie auf der Matte, vorderer Fuß flach, Oberkörper aufrecht.',
    steps: ['Becken leicht aufrichten (Gesäß anspannen).', 'Hüfte langsam nach vorn schieben, Arm der Knieseite nach oben strecken.', 'Je Seite 45–60 s ruhig atmen, dann wechseln.'],
    mistakes: ['Ins Hohlkreuz ausweichen', 'Vorderes Knie weit über die Zehen'],
    safety: ['Weiche Unterlage unter dem Knie', 'Nur angenehmes Ziehen, kein Schmerz'],
    figure: {
      view: 'side', highlight: ['quads1', 'abs'],
      equipment: [{ type: 'mat', x1: 36, x2: 186 }],
      startPose: { hip: [110, 146], torso: -90, arms: [{ ua: 95, fa: 80 }], legs: [{ ankle: [152, 184], bend: -1, ft: 0 }, { th: 105, sh: 180, ft: 100 }] },
      endPose: { hip: [124, 148], torso: -97, arms: [{ ua: -100, fa: -98 }], legs: [{ ankle: [152, 184], bend: -1, ft: 0 }, { th: 124, sh: 178, ft: 100 }] },
      arrows: [{ from: 'hip', off: [0, -26], bend: 0 }, { from: 'hand0', off: [12, 0], bend: -30 }]
    }
  }
};

/** Liefert eine Übung aus Bibliothek oder eigenen Übungen. */
export function getExercise(exId, state) {
  if (EXERCISES[exId]) return { id: exId, ...EXERCISES[exId] };
  const c = state?.customExercises?.find((x) => x.id === exId);
  if (c) return { id: c.id, name: c.name, equipment: c.equipment || '', primary: c.primary || [], secondary: [], custom: true,
    start: c.start || '', steps: c.steps || [], mistakes: [], safety: [] };
  return null;
}

export function allExercises(state) {
  return [
    ...Object.keys(EXERCISES).map((id) => ({ id, ...EXERCISES[id] })),
    ...(state?.customExercises || []).map((c) => getExercise(c.id, state))
  ];
}
