var CASES = {
  rose_rust: {
    id: "rose_rust",
    title: "Orange Alert",
    plant: "Climbing Rose",
    plantSprite: "rose",
    visual: { sprite: "rose", spots: true, spotColor: "#d96a1f", spotColor2: "#b54517" },
    diseaseName: "Rose rust",
    correctDisease: "rose_rust",
    difficulty: "Easy",
    mainLesson: "Check the leaf undersides",
    mechanic: "Owner interview",
    outcomeDelay: "10 days later...",
    outcomes: {
      recovered: "No new rust pustules appeared, and clean new leaves began opening. Removing infected tissue and keeping foliage dry interrupted the infection cycle.",
      stable: "The spread slowed, but a few new spots appeared. More complete sanitation or airflow improvement would reduce future infections.",
      worsened: "New orange pustules appeared on additional leaves. Review the underside evidence and the conditions that keep foliage wet.",
      plant_lost: "Severe leaf loss weakened the rose. The selected diagnosis and harmful actions did not address the infection safely."
    },
    emergencyOutcomeDelay: "3 hours later...",
    emergencyOutcomes: {
      recovered: "The rusted leaves were bagged before spores spread further. The remaining canes are stressed but dry, and the emergency plan has protected the clean growth.",
      stable: "The immediate spread slowed, but several canes remain thin and vulnerable. Continue sanitation and keep the rose foliage dry through the evening.",
      worsened: "Active rust remained throughout the crowded canes as the next watering window approached. The response did not fully isolate infected tissue or keep foliage dry.",
      plant_lost: "The intervention window closed before infected tissue and wet-foliage risks were controlled. Follow-up over the next several days confirmed that the weakened rose could not recover."
    },
    maxQuestions: 4,
    customer: "Mrs. Petal",
    portrait: { skin: "#e7b57d", hair: "#744638", shirt: "#b74955", accent: "#f0c868", accessory: "flower" },
    intro: [
      "Please, doctor! Something is wrong with my roses.",
      "About two weeks ago I noticed orange spots on the leaves, and now they seem to be spreading.",
      "I love these bushes — please tell me what to do!"
    ],
    patientRecord: {
      species: "Climbing rose, several bushes",
      symptomsBegin: "First noticed about two weeks ago",
      weather: "A long stretch of rainy, humid days recently",
      watering: "Watered almost every evening, sprinkler soaks the leaves",
      spacing: "Planted fairly close together near a wall",
      history: "No previous disease problems"
    },
    hotspots: [
      { id: "leaf_top", name: "Upper leaf surface", nx: 0.36, ny: 0.38,
        observation: "Yellow-orange spots are scattered across the upper surfaces of the leaves.",
        flip: null, clue: "leaf_top" },
      { id: "leaf_under", name: "Underside of leaves", nx: 0.73, ny: 0.34,
        observation: "The undersides look dusty and slightly grimy.",
        flip: { label: "Flip the leaf over", text: "Orange-brown powdery pustules line the underside — these are the classic rust spore clusters.", clue: "leaf_under" },
        clue: null },
      { id: "fallen", name: "Lower leaves & fallen litter", nx: 0.45, ny: 0.8,
        observation: "Fallen leaves collect around the base of the pot, dotted with rust-colored bumps.",
        flip: null, clue: "fallen" },
      { id: "canopy", name: "Stems & canopy", nx: 0.54, ny: 0.49,
        observation: "The stems are packed tightly together; air barely moves between the branches.",
        flip: null, clue: "canopy" }
    ],
    questions: [
      { id: "q_watering", text: "How often do you water, and how do you apply the water?",
        answer: "I water almost every evening, and I soak the leaves too to cool them down.", clue: "q_watering" },
      { id: "q_neighbors", text: "Do the nearby roses show the same signs?",
        answer: "No — the roses across the garden look perfectly fine.", clue: null },
      { id: "q_timing", text: "When did the spots first appear?",
        answer: "About two weeks ago, right after a stretch of rainy, humid days.", clue: "q_timing" },
      { id: "q_spacing", text: "How close together are the bushes planted?",
        answer: "Quite close to a wall, so there isn't much airflow between them.", clue: "q_spacing" }
    ],
    diseases: [
      { id: "rose_rust", name: "Rose rust", description: "Orange rust pustules usually form beneath leaves, with yellow-orange spotting above and repeat infections in damp conditions.", clues: { leaf_under: 3, leaf_top: 2, fallen: 2, canopy: 1, q_watering: 2, q_timing: 1, q_spacing: 1 } },
      { id: "powdery_mildew", name: "Powdery mildew", description: "A wipeable white coating develops on leaves and stems, often in crowded, humid air even when foliage is not wet.", clues: { leaf_top: 1, canopy: 1, q_neighbors: 1, q_watering: 0 } },
      { id: "black_spot", name: "Rose black spot", description: "Dark round leaf lesions with fringed edges and yellow halos commonly cause rose leaves to yellow and drop.", clues: { leaf_top: 2, fallen: 1, q_watering: 1, q_spacing: 0 } }
    ],
    diagnosisOptions: [
      { id: "rose_rust", label: "Rose rust" },
      { id: "powdery_mildew", label: "Powdery mildew" },
      { id: "black_spot", label: "Rose black spot" }
    ],
    evidenceOptions: [
      { id: "e_under", text: "Orange powdery pustules on the leaf undersides", correct: true, clue: "leaf_under" },
      { id: "e_top", text: "Yellow-orange spots on the upper surfaces", correct: true, clue: "leaf_top" },
      { id: "e_fallen", text: "Fallen leaves with rust-colored bumps", correct: true, clue: "fallen" },
      { id: "e_wet", text: "Evening watering that keeps the leaves wet", correct: true, clue: "q_watering" },
      { id: "e_white", text: "White powdery coating on stems and leaves", correct: false, clue: null },
      { id: "e_rings", text: "Target-like concentric rings on the leaves", correct: false, clue: null },
      { id: "e_gray", text: "Gray-purple fuzzy growth under the leaves", correct: false, clue: null },
      { id: "e_root", text: "Soft, dark, decaying roots in soggy soil", correct: false, clue: null }
    ],
    treatments: {
      immediate: [
        { id: "im_remove", label: "Pick off infected leaves and remove all fallen leaves", points: 10, harm: 0, correct: true, eco: true, safe: false },
        { id: "im_prune", label: "Prune crowded stems to improve airflow", points: 5, harm: 0, correct: true, eco: true, safe: false },
        { id: "im_compost", label: "Put infected trimmings straight into a cool home compost pile", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      environment: [
        { id: "env_water", label: "Water at the base early in the day; keep the foliage dry", points: 10, harm: 0, correct: true, eco: true, safe: false },
        { id: "env_space", label: "Open up the planting so air circulates between the bushes", points: 5, harm: 0, correct: true, eco: true, safe: false },
        { id: "env_evening", label: "Rinse the foliage with a fine evening mist to wash spores away", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      preventive: [
        { id: "prev_fung", label: "Apply a rose-labeled preventive fungicide (e.g. sulfur or copper), following the label", points: 10, harm: 0, correct: true, eco: false, safe: true },
        { id: "prev_dose", label: "Use twice the label rate of a rose fungicide for faster control", points: 0, harm: 20, correct: false, eco: false, safe: false },
        { id: "prev_none", label: "Use no product now; monitor new growth after sanitation and environment fixes", points: 10, harm: 0, correct: true, eco: true, safe: true }
      ]
    },
    emergencyTreatments: {
      immediate: [
        { id: "em_im_bag_rust", label: "Remove and bag every leaf with active rust pustules plus all fallen litter", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_im_prune_rust", label: "Prune only canes that are badly defoliated or carrying repeated pustules", points: 5, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_im_cut_rust", label: "Cut every cane to ground level before checking which tissue is infected", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      environment: [
        { id: "em_env_dry_rust", label: "Stop overhead watering and water at soil level early in the day", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_env_tools_rust", label: "Disinfect pruners between bushes and open the canopy for airflow", points: 5, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_env_feed_rust", label: "Use a high-nitrogen feed to force rapid replacement foliage", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      preventive: [
        { id: "em_prev_label_rust", label: "Use a rose-labeled rust protectant at the label rate after sanitation", points: 10, harm: 0, correct: true, eco: false, safe: true },
        { id: "em_prev_monitor_rust", label: "Skip product for now and inspect clean new growth after cultural controls", points: 10, harm: 0, correct: true, eco: true, safe: true, monitorOnly: true },
        { id: "em_prev_rate_rust", label: "Apply a higher-than-label fungicide rate to make up for lost time", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ]
    },
    lesson: "Rust spores germinate when leaves stay wet. Keep foliage dry, improve airflow, remove fallen leaves, and follow the label if you use a preventive. Existing spots will not vanish — treatment prevents NEW infections."
  },

  powdery_mildew: {
    id: "powdery_mildew",
    title: "A Powdery Mystery",
    plant: "Squash Seedling",
    plantSprite: "squash",
    visual: { sprite: "squash", powder: true, powderColor: "#efe9d9", powderColor2: "#e4dcc8" },
    diseaseName: "Powdery mildew",
    correctDisease: "powdery_mildew",
    difficulty: "Medium",
    mainLesson: "Powdery mildew does not need constantly wet leaves",
    meter: {
      humidity: 82,
      leafWetness: "LOW",
      interpretation: "High air humidity with mostly dry leaf surfaces supports powdery mildew and argues against diseases that need prolonged free water."
    },
    outcomeDelay: "7 days later...",
    outcomes: {
      recovered: "The white coating stopped spreading, and the newest leaves remained clean. Better spacing and ventilation reduced favorable conditions.",
      stable: "The existing coating remained, but spread slowed. Stronger airflow and removal of heavily affected leaves would improve control.",
      worsened: "The white coating expanded onto more leaves and stems. Recheck the dry-leaf clue, crowding, and excess nitrogen.",
      plant_lost: "The seedlings declined after the disease was misidentified and harmful actions added stress."
    },
    emergencyOutcomeDelay: "2 hours later...",
    emergencyOutcomes: {
      recovered: "The most heavily affected leaves were removed and clean seedlings were separated before the next humid period. Airflow now protects the remaining foliage.",
      stable: "The source was partly reduced, but several seedlings remain heavily affected. Keep airflow high and inspect new growth over the coming days.",
      worsened: "The crowded, humid conditions were not corrected before the next high-risk period. Follow-up showed powdery growth spreading across more seedlings.",
      plant_lost: "The intervention window closed without enough healthy leaf area being protected. Follow-up confirmed that the affected tray was no longer viable."
    },
    maxQuestions: 3,
    customer: "Farmer Roots",
    portrait: { skin: "#c98f5e", hair: "#5b3b2d", shirt: "#47715a", accent: "#d9a94e", accessory: "hat" },
    intro: [
      "Doc, my squash seedlings have gone white!",
      "There's a dusty powder all over the upper leaves and it keeps spreading.",
      "The leaves have never stayed wet, so I don't understand."
    ],
    patientRecord: {
      species: "Squash seedlings, several pots",
      symptomsBegin: "Started about a week ago",
      weather: "Humid and still, warm days",
      watering: "Soil watered only; foliage dries quickly",
      spacing: "Pots packed closely together on a shelf",
      history: "Heavily fertilized recently"
    },
    hotspots: [
      { id: "powder_upper", name: "Upper leaf surface", nx: 0.57, ny: 0.3,
        observation: "A fine white powder dusts the surface of the leaves and stems.",
        flip: null, clue: "powder_upper" },
      { id: "base_check", name: "Stem bases", nx: 0.51, ny: 0.73,
        observation: "The stems look white and powdery too, but the leaf undersides are mostly clean — no gray fuzz.",
        flip: null, clue: "not_wet" },
      { id: "spacing", name: "Crowded overlapping leaves", nx: 0.81, ny: 0.57,
        observation: "The pots are packed tightly together; the air between them is humid and very still.",
        flip: null, clue: "crowding" },
      { id: "soil", name: "Soil & watering", nx: 0.52, ny: 0.82,
        observation: "The soil is moist but not waterlogged, and the leaves have never stayed wet for long.",
        flip: null, clue: "not_wet" }
    ],
    questions: [
      { id: "q_wet", text: "Do the leaves stay wet for long periods?",
        answer: "No — I water the soil only, and the leaves dry quickly.", clue: "not_wet" },
      { id: "q_fert", text: "Have you fertilized the seedlings recently?",
        answer: "Yes, quite a lot of fast-acting fertilizer this month.", clue: "nitrogen" },
      { id: "q_air", text: "Where are the pots located?",
        answer: "On a shelf near a window, where the air is fairly still.", clue: "crowding" },
      { id: "q_other", text: "Do any other plants show the same powder?",
        answer: "Only the ones packed closest together.", clue: "crowding" }
    ],
    diseases: [
      { id: "powdery_mildew", name: "Powdery mildew", description: "White powder coats upper leaves and stems; still humid air and excess nitrogen can favor it without prolonged leaf wetness.", clues: { powder_upper: 4, not_wet: 2, crowding: 2, nitrogen: 2 } },
      { id: "downy_mildew", name: "Downy mildew", description: "Angular yellow patches and gray-purple growth below leaves are favored by cool, wet foliage and extended leaf wetness.", clues: { powder_upper: 0, not_wet: 1, crowding: 1 } },
      { id: "alternaria_leaf_blight", name: "Alternaria leaf blight", description: "Brown leaf lesions often develop concentric target-like rings and spread under warm, wet conditions.", clues: { powder_upper: 0, not_wet: 1 } }
    ],
    diagnosisOptions: [
      { id: "powdery_mildew", label: "Powdery mildew" },
      { id: "downy_mildew", label: "Downy mildew" },
      { id: "alternaria_leaf_blight", label: "Alternaria leaf blight" }
    ],
    evidenceOptions: [
      { id: "e_powder", text: "White powdery coating on the upper leaves and stems", correct: true, clue: "powder_upper" },
      { id: "e_dry", text: "Leaves are dry and never stay wet", correct: true, clue: "not_wet" },
      { id: "e_crowd", text: "Pots packed close together in still, humid air", correct: true, clue: "crowding" },
      { id: "e_nitro", text: "Heavy nitrogen fertilizer recently applied", correct: true, clue: "nitrogen" },
      { id: "e_grayfuzz", text: "Gray-purple fuzzy growth under the leaves", correct: false, clue: null },
      { id: "e_wetleaves", text: "Leaves constantly wet from overhead watering", correct: false, clue: null },
      { id: "e_rings", text: "Target-like concentric rings on the leaves", correct: false, clue: null },
      { id: "e_soggy", text: "Soft mushy roots in waterlogged soil", correct: false, clue: null }
    ],
    treatments: {
      immediate: [
        { id: "im_remove", label: "Remove heavily infected leaves and dispose of them", points: 10, harm: 0, correct: true, eco: true, safe: false },
        { id: "im_space", label: "Increase spacing between the pots for airflow", points: 5, harm: 0, correct: true, eco: true, safe: false },
        { id: "im_nitro", label: "Give a light nitrogen feed to help the seedlings replace damaged leaves", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      environment: [
        { id: "env_air", label: "Improve ventilation and move the seedlings to a sunnier spot", points: 10, harm: 0, correct: true, eco: true, safe: false },
        { id: "env_soil", label: "Water at the soil level and keep the foliage dry", points: 5, harm: 0, correct: true, eco: true, safe: false },
        { id: "env_mist", label: "Rinse foliage with overhead water each morning, then rely on ventilation", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      preventive: [
        { id: "prev_oil", label: "Apply a labeled option such as neem oil, horticultural oil, or sulfur, following the label", points: 10, harm: 0, correct: true, eco: false, safe: true },
        { id: "prev_oil_sulfur", label: "Alternate sulfur and horticultural oil in the same week for broader coverage", points: 0, harm: 20, correct: false, eco: false, safe: false },
        { id: "prev_skip", label: "Use no product now; monitor new growth after spacing and ventilation fixes", points: 10, harm: 0, correct: true, eco: true, safe: true }
      ]
    },
    emergencyTreatments: {
      immediate: [
        { id: "em_im_remove_powder", label: "Remove the leaves with the heaviest powdery growth and dispose of them", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_im_space_powder", label: "Separate the crowded pots and keep the cleanest seedlings apart", points: 5, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_im_strip_powder", label: "Remove all leaves at once so no spores remain on the plant", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      environment: [
        { id: "em_env_air_powder", label: "Increase airflow and move plants into brighter, less crowded conditions", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_env_base_powder", label: "Keep watering at soil level and avoid excess nitrogen fertilizer", points: 5, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_env_rinse_powder", label: "Rinse all foliage daily with overhead water before the lights come on", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      preventive: [
        { id: "em_prev_label_powder", label: "Use one labeled powdery-mildew product, observing heat and compatibility limits", points: 10, harm: 0, correct: true, eco: false, safe: true },
        { id: "em_prev_monitor_powder", label: "Use no product and monitor clean new growth after spacing the plants", points: 10, harm: 0, correct: true, eco: true, safe: true, monitorOnly: true },
        { id: "em_prev_mix_powder", label: "Combine sulfur and horticultural oil in one urgent rescue spray", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ]
    },
    lesson: "Powdery mildew is favored by humid conditions and does not require free water on leaf surfaces. Improve airflow, reduce crowding, avoid excess nitrogen, and only use a labeled product. Never apply sulfur and horticultural oil close together or in heat.",
    mechanic: "Humidity meter"
  },

  basil_downy_mildew: {
    id: "basil_downy_mildew",
    title: "The Hidden Fuzz",
    plant: "Sweet Basil",
    plantSprite: "basil",
    visual: { sprite: "basil", downy: true, lesionColor: "#7f7045", fuzzColor: "#66596f" },
    diseaseName: "Downy mildew",
    correctDisease: "basil_downy_mildew",
    difficulty: "Hard",
    mainLesson: "Similar-looking diseases need different controls",
    mechanic: "Magnifying glass + Leaf Flip",
    meter: {
      humidity: 91,
      leafWetness: "HIGH OVERNIGHT",
      interpretation: "Very humid nights and prolonged leaf dampness strongly favor downy mildew sporulation on leaf undersides."
    },
    outcomeDelay: "8 days later...",
    outcomes: {
      recovered: "The infected leaves were removed and the remaining basil stayed dry overnight. Fresh growth opened without new yellow patches.",
      stable: "Spread slowed, but a few angular yellow patches remained. More spacing and earlier watering would further reduce overnight humidity.",
      worsened: "Yellowing and gray-purple underside growth spread through the canopy. The hidden underside evidence and humid nights were not addressed.",
      plant_lost: "The basil declined rapidly after the look-alike disease was misidentified and unsafe actions increased stress."
    },
    emergencyOutcomeDelay: "4 hours later...",
    emergencyOutcomes: {
      recovered: "The worst basil was bagged before the spores reached the separated plants. Air is moving through the remaining tray, and no new gray-purple growth is visible yet.",
      stable: "The outbreak has been contained to part of the tray, but the remaining basil is still under close watch. Overnight humidity must stay low to hold the line.",
      worsened: "Leaves with active underside sporulation remained in the tray as overnight humidity approached. Follow-up showed the outbreak spreading to nearby basil.",
      plant_lost: "The intervention window closed before infected basil was isolated. The affected tray was later removed to protect the rest of the greenhouse."
    },
    maxQuestions: 4,
    customer: "Chef Sage",
    portrait: { skin: "#bd7d58", hair: "#332b2a", shirt: "#744b78", accent: "#f0eee0", accessory: "chef" },
    intro: [
      "My basil looks pale and bruised, but I cannot find white powder on top.",
      "The yellow patches seem trapped between the veins, and several leaves curl at the edges.",
      "It is growing in a crowded greenhouse. Can an interview help separate two similar mildews?"
    ],
    patientRecord: {
      species: "Sweet basil, dense greenhouse tray",
      symptomsBegin: "Pale patches appeared five days ago",
      weather: "Warm days, cool humid nights",
      watering: "Overhead irrigation late in the afternoon",
      spacing: "Plants touch across most of the tray",
      history: "Nearby basil developed the same symptoms"
    },
    hotspots: [
      { id: "angular_yellow", name: "Angular yellow leaf patches", nx: 0.37, ny: 0.35,
        observation: "Pale yellow areas are bounded by the leaf veins instead of forming a wipeable white surface coating.",
        flip: null, clue: "angular_yellow" },
      { id: "downy_under", name: "Gray-purple leaf underside", nx: 0.83, ny: 0.36,
        observation: "The underside looks dull and shadowed beneath a yellow patch.",
        flip: { label: "Turn the leaf underside up", text: "Fine gray-purple fuzzy growth follows the veins on the underside — characteristic downy mildew sporulation.", clue: "downy_under" },
        clue: null },
      { id: "curled_margin", name: "Curled necrotic margin", nx: 0.78, ny: 0.25,
        observation: "An older leaf curls downward with dark brown tissue spreading inward from its edge.",
        flip: null, clue: "curled_margin" },
      { id: "dense_canopy", name: "Dense humid canopy", nx: 0.49, ny: 0.68,
        observation: "Leaves overlap heavily, trapping humid air around the lower surfaces overnight.",
        flip: null, clue: "dense_canopy" }
    ],
    questions: [
      { id: "q_night_humidity", text: "What happens to humidity overnight?",
        answer: "Condensation forms in the greenhouse most mornings, and the leaves stay damp until late morning.", clue: "night_humidity" },
      { id: "q_watering_basil", text: "When and how is the basil watered?",
        answer: "I spray the tray late in the afternoon, so the canopy often remains wet after sunset.", clue: "late_overhead" },
      { id: "q_spread_basil", text: "Did symptoms begin on one plant or across nearby basil?",
        answer: "They began in one crowded corner and then appeared on neighboring basil plants.", clue: "spreading_basil" },
      { id: "q_wipe", text: "Does the growth wipe off the upper surface like powder?",
        answer: "No. There is no obvious white coating on top; the strange fuzz is underneath.", clue: "not_powdery" },
      { id: "q_flavor", text: "Has the basil flavor changed?",
        answer: "I have not tasted the affected leaves.", clue: null }
    ],
    diseases: [
      { id: "basil_downy_mildew", name: "Downy mildew", description: "Basil develops angular yellow areas above and gray-purple sporulation below, especially after humid nights and late overhead watering.", clues: { angular_yellow: 3, downy_under: 4, curled_margin: 1, dense_canopy: 1, night_humidity: 2, late_overhead: 2, spreading_basil: 1, not_powdery: 2 } },
      { id: "powdery_mildew", name: "Powdery mildew", description: "A white, wipeable powder appears mainly on upper surfaces; unlike downy mildew, it does not create gray-purple underside growth.", clues: { dense_canopy: 1, night_humidity: 1 } },
      { id: "basil_fusarium_wilt", name: "Basil Fusarium wilt", description: "Plants wilt and yellow as the vascular system browns, often starting unevenly rather than as angular leaf patches.", clues: { angular_yellow: 1, curled_margin: 1 } }
    ],
    diagnosisOptions: [
      { id: "basil_downy_mildew", label: "Downy mildew" },
      { id: "powdery_mildew", label: "Powdery mildew" },
      { id: "basil_fusarium_wilt", label: "Basil Fusarium wilt" }
    ],
    evidenceOptions: [
      { id: "e_angular", text: "Yellow patches bounded by leaf veins", correct: true, clue: "angular_yellow" },
      { id: "e_downy_under", text: "Gray-purple fuzzy growth on the leaf underside", correct: true, clue: "downy_under" },
      { id: "e_humid_night", text: "Cool humid nights with morning condensation", correct: true, clue: "night_humidity" },
      { id: "e_not_white", text: "No wipeable white powder on the upper surface", correct: true, clue: "not_powdery" },
      { id: "e_white_top", text: "White powder coating both leaf surfaces", correct: false, clue: null },
      { id: "e_uniform_yellow", text: "Uniform yellowing across every old leaf", correct: false, clue: null },
      { id: "e_root_rot", text: "Soft black roots in saturated soil", correct: false, clue: null },
      { id: "e_insects", text: "Webbing and moving mites under leaves", correct: false, clue: null }
    ],
    treatments: {
      immediate: [
        { id: "im_remove_basil", label: "Remove heavily infected basil and bag the diseased material", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "im_separate_basil", label: "Separate apparently healthy plants from the infected tray", points: 5, harm: 0, correct: true, eco: true, safe: true },
        { id: "im_eat_basil", label: "Remove only yellow leaves and keep green leaves with underside fuzz for harvest", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      environment: [
        { id: "env_vent_basil", label: "Increase spacing and ventilation, especially overnight", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "env_morning_basil", label: "Water the soil early so foliage dries before night", points: 5, harm: 0, correct: true, eco: true, safe: true },
        { id: "env_humid_basil", label: "Run fans in daytime only and close vents overnight to protect basil from cool air", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      preventive: [
        { id: "prev_resistant_basil", label: "For the next crop, choose downy-mildew-resistant basil cultivars", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "prev_labeled_basil", label: "If needed, use only a product labeled for edible basil and downy mildew", points: 10, harm: 0, correct: true, eco: false, safe: true },
        { id: "prev_household_basil", label: "Use a food-safe soap spray that is not labeled for downy mildew", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ]
    },
    emergencyTreatments: {
      immediate: [
        { id: "em_im_bag_basil", label: "Bag and discard the heavily infected basil plants to reduce spore spread", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_im_isolate_basil", label: "Separate apparently healthy basil from the affected tray immediately", points: 5, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_im_save_basil", label: "Keep plants with underside fuzz if their upper leaves still look green", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      environment: [
        { id: "em_env_vent_basil", label: "Run ventilation overnight and space remaining basil to lower leaf humidity", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_env_morning_basil", label: "Water at the soil early so leaves are dry before nightfall", points: 5, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_env_warm_basil", label: "Close vents overnight to retain warmth around the stressed basil", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      preventive: [
        { id: "em_prev_resistant_basil", label: "Restart with downy-mildew-resistant basil cultivars after cleanup", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_prev_label_basil", label: "Use only a product labeled for edible basil and downy mildew if needed", points: 10, harm: 0, correct: true, eco: false, safe: true },
        { id: "em_prev_soap_basil", label: "Use a food-safe soap spray even though it is not labeled for downy mildew", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ]
    },
    lesson: "Downy mildew often causes angular yellow patches above and gray-purple sporulation below. It differs from powdery mildew, so inspect both leaf surfaces and ask about humid nights, watering time, and spread."
  },

  tomato_septoria: {
    id: "tomato_septoria",
    title: "Spots from the Soil",
    plant: "Tomato Plant",
    plantSprite: "tomato",
    visual: { sprite: "tomato", septoria: true, lesionColor: "#8b5a38", centerColor: "#c6ad75" },
    diseaseName: "Septoria leaf spot",
    correctDisease: "tomato_septoria",
    difficulty: "Expert",
    mainLesson: "Soil splash, lower leaves, sanitation, and mulch",
    mechanic: "Evidence selection",
    meter: {
      humidity: 76,
      leafWetness: "HIGH AFTER RAIN",
      interpretation: "Warm wet periods support Septoria infection, while rain and overhead irrigation splash spores from debris and soil onto lower foliage."
    },
    outcomeDelay: "12 days later...",
    outcomes: {
      recovered: "Lower-leaf removal, mulch, and dry foliage stopped most new spots. The upper canopy and fruit remained healthy.",
      stable: "Defoliation slowed, but a few new lower spots appeared after rain. More complete debris removal and splash protection would help.",
      worsened: "Small dark-bordered spots climbed from the lower canopy as rain splashed spores upward.",
      plant_lost: "Heavy defoliation exposed and weakened the tomato after the lower-leaf disease was misidentified and harmful actions continued."
    },
    emergencyOutcomeDelay: "3 hours later...",
    emergencyOutcomes: {
      recovered: "The spotted lower leaves and debris were removed before the next splash event. The fruit remains clean, and mulch now protects the surviving canopy.",
      stable: "The lower canopy is holding after emergency pruning, but the tomato needs continued dry foliage and mulch before the next rain to avoid another flare-up.",
      worsened: "Contaminated debris and splash pathways remained as the next storm approached. Follow-up showed pale-centered spots progressing into the upper canopy.",
      plant_lost: "The intervention window closed before splash dispersal and infected debris were controlled. The tomato later lost too much productive foliage to recover."
    },
    maxQuestions: 4,
    customer: "Mr. Sprout",
    portrait: { skin: "#d8a06c", hair: "#6a442f", shirt: "#426d86", accent: "#78a85c", accessory: "cap" },
    intro: [
      "My tomato is losing leaves from the bottom upward.",
      "The spots are small, with pale centers and dark edges. The fruit still looks clean.",
      "It started after several storms splashed bare soil onto the lower leaves."
    ],
    patientRecord: {
      species: "Staked tomato in a garden bed",
      symptomsBegin: "Lower leaves spotted after repeated rain",
      weather: "Warm, wet, frequent thunderstorms",
      watering: "Overhead sprinkler plus rainfall",
      spacing: "Moderate, with branches touching soil",
      history: "Old tomato debris remained in the bed"
    },
    hotspots: [
      { id: "septoria_spots", name: "Small lower-leaf spots", nx: 0.22, ny: 0.62,
        observation: "Many small round lesions have dark margins and pale gray-tan centers; tiny black dots are visible in several centers.",
        flip: null, clue: "septoria_spots" },
      { id: "lower_progression", name: "Bottom-up progression", nx: 0.65, ny: 0.66,
        observation: "The oldest leaves nearest the soil are yellowing and most heavily spotted, while upper growth is cleaner.",
        flip: null, clue: "lower_progression" },
      { id: "soil_splash", name: "Bare splashed soil", nx: 0.5, ny: 0.84,
        observation: "Bare soil is crusted from rain, and mud marks reach the lowest stems and leaves. No mulch blocks splash.",
        flip: null, clue: "soil_splash" },
      { id: "clean_fruit", name: "Unspotted fruit", nx: 0.77, ny: 0.45,
        observation: "The green tomato fruit is firm and unspotted even though nearby leaves are diseased.",
        flip: null, clue: "clean_fruit" }
    ],
    questions: [
      { id: "q_first_tomato", text: "Where did the first symptoms appear?",
        answer: "On the lowest leaves, then they moved upward after each storm.", clue: "started_low" },
      { id: "q_splash_tomato", text: "Is the bed mulched, and how is it watered?",
        answer: "There is no mulch, and sprinklers wet the leaves and splash soil onto them.", clue: "splash_history" },
      { id: "q_debris_tomato", text: "Was last year's tomato debris removed?",
        answer: "Some old leaves and stems were left in this same bed over winter.", clue: "old_debris" },
      { id: "q_fruit_tomato", text: "Are there spots on the fruit?",
        answer: "No, the fruit looks clean. The damage is concentrated on the foliage.", clue: "fruit_clean" },
      { id: "q_fertilizer_tomato", text: "Which fertilizer brand did you use?",
        answer: "A balanced garden fertilizer at the label rate.", clue: null }
    ],
    diseases: [
      { id: "tomato_septoria", name: "Septoria leaf spot", description: "Many small circular leaf spots with pale centers and tiny black fruiting bodies start low and move upward after soil splash.", clues: { septoria_spots: 4, lower_progression: 3, soil_splash: 2, clean_fruit: 1, started_low: 2, splash_history: 2, old_debris: 1, fruit_clean: 1 } },
      { id: "early_blight", name: "Early blight", description: "Larger brown lesions with concentric target rings usually begin on older lower foliage and can progress after wet weather.", clues: { lower_progression: 2, soil_splash: 1, started_low: 2, old_debris: 1 } },
      { id: "bacterial_spot", name: "Bacterial spot", description: "Dark, water-soaked-looking spots may appear on foliage and fruit, especially after warm, wet weather and handling.", clues: { soil_splash: 1, splash_history: 1 } }
    ],
    diagnosisOptions: [
      { id: "tomato_septoria", label: "Septoria leaf spot" },
      { id: "early_blight", label: "Early blight" },
      { id: "bacterial_spot", label: "Bacterial spot" }
    ],
    evidenceOptions: [
      { id: "e_small_tan", text: "Many small spots with pale centers and dark borders", correct: true, clue: "septoria_spots" },
      { id: "e_lower_first", text: "Disease begins on lower leaves and moves upward", correct: true, clue: "lower_progression" },
      { id: "e_splash", text: "Bare soil and overhead water create splash dispersal", correct: true, clue: "soil_splash" },
      { id: "e_clean_fruit", text: "Fruit remains unspotted while foliage is affected", correct: true, clue: "clean_fruit" },
      { id: "e_target_rings", text: "Large lesions with concentric target rings", correct: false, clue: null },
      { id: "e_fruit_lesions", text: "Raised scabby lesions cover leaves and fruit", correct: false, clue: null },
      { id: "e_white_powder", text: "White powder coats the upper leaves", correct: false, clue: null },
      { id: "e_wilt", text: "The whole plant wilts despite moist soil", correct: false, clue: null }
    ],
    treatments: {
      immediate: [
        { id: "im_remove_tomato", label: "Remove the heavily infected lower leaves and fallen debris", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "im_stake_tomato", label: "Stake and prune so remaining foliage stays off the soil", points: 5, harm: 0, correct: true, eco: true, safe: true },
        { id: "im_strip_tomato", label: "Remove all lower leaves, including clean ones, to eliminate hidden spores", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      environment: [
        { id: "env_mulch_tomato", label: "Add clean mulch to block soil splash", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "env_base_tomato", label: "Water at soil level early in the day", points: 5, harm: 0, correct: true, eco: true, safe: true },
        { id: "env_splash_tomato", label: "Use overhead water early in the day to rinse splash residue before mulching", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      preventive: [
        { id: "prev_rotate_tomato", label: "Rotate crops and remove tomato-family debris after harvest", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "prev_fung_tomato", label: "If pressure remains high, use a tomato-labeled protectant exactly as directed", points: 10, harm: 0, correct: true, eco: false, safe: true },
        { id: "prev_bleach_tomato", label: "Use a dilute household disinfectant rinse on the soil surface between storms", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ]
    },
    emergencyTreatments: {
      immediate: [
        { id: "em_im_remove_tomato", label: "Remove and bag the spotted lower leaves and all fallen tomato debris", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_im_stake_tomato", label: "Stake and prune only foliage that touches soil or blocks airflow", points: 5, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_im_bare_tomato", label: "Strip every lower leaf, including clean leaves, to be certain no spores remain", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      environment: [
        { id: "em_env_mulch_tomato", label: "Mulch bare soil now to stop rain and irrigation splash reaching foliage", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_env_base_tomato", label: "Water at soil level early and keep leaves as dry as practical", points: 5, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_env_rinse_tomato", label: "Use overhead water to rinse lesions before adding mulch", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ],
      preventive: [
        { id: "em_prev_rotate_tomato", label: "Remove tomato-family debris and rotate the bed after harvest", points: 10, harm: 0, correct: true, eco: true, safe: true },
        { id: "em_prev_label_tomato", label: "If pressure continues, use a tomato-labeled protectant exactly as directed", points: 10, harm: 0, correct: true, eco: false, safe: true },
        { id: "em_prev_disinfect_tomato", label: "Disinfect the soil surface with a household sanitizer between storms", points: 0, harm: 20, correct: false, eco: false, safe: false }
      ]
    },
    lesson: "Septoria leaf spot commonly begins on lower tomato leaves. Small pale-centered spots, tiny black fruiting bodies, clean fruit, old debris, and soil splash distinguish it from important look-alikes."
  }
};

var CASE_ORDER = ["rose_rust", "powdery_mildew", "basil_downy_mildew", "tomato_septoria"];
