/**
 * Contenu institutionnel de référence.
 * Source : Statuts de l'ACH (version du 13/10/2026) et informations fournies par l'Académie.
 * Les textes du fondateur proviennent de son site officiel (drmichelmuvudi.com) et peuvent être
 * remplacés depuis la table site_settings (clés « founder.* »), sans redéploiement.
 */

export const ACH = {
  name: 'Académie du Capital Humain',
  short: 'ACH',
  motto: 'Le capital humain, socle de toute création des valeurs.',
  address: '287, Basankusu, Lingwala, Kinshasa, République démocratique du Congo',
  // Coordonnées non communiquées : laissées vides plutôt qu'inventées.
  email: '',
  phone: '+243 830 001 108',
  socials: [] as { label: string; href: string }[],
};

// Statuts, art. 3 (objet).
export const OBJECTIVES = [
  'Organiser des formations initiales, continues, professionnelles et non formelles, des séminaires, conférences, ateliers et programmes de mentorat.',
  'Renforcer les capacités des personnes, des entreprises, des administrations, des associations et des communautés.',
  'Concevoir et diffuser des ressources pédagogiques, des études, des outils et des publications.',
  'Mener des recherches appliquées et nouer des partenariats en formation, ressources humaines, leadership, entrepreneuriat et développement organisationnel.',
  "Accompagner l'insertion professionnelle, l'orientation et le développement de carrière.",
  "Promouvoir l'accès équitable à la formation, notamment pour les jeunes et les groupes en situation de vulnérabilité.",
];

// Statuts, contexte : principes d'action.
export const VALUES = [
  { t: 'Respect des lois', d: "L'Académie agit dans le respect des lois de la République démocratique du Congo." },
  { t: 'Liberté de conscience', d: 'Un cadre ouvert à toutes et à tous, sans distinction de convictions.' },
  { t: 'Égalité de traitement', d: 'Les mêmes chances pour chaque apprenant et chaque partenaire.' },
  { t: 'Transparence', d: 'Des comptes tenus régulièrement et contrôlés.' },
  { t: 'Bonne gouvernance', d: 'Des organes aux rôles définis par les statuts.' },
  { t: 'But non lucratif', d: 'Les ressources sont affectées à la réalisation de son objet et à son développement.' },
];

export const MISSION =
  "Contribuer au développement du capital humain par la formation, le renforcement des capacités, la recherche appliquée, l'accompagnement scientifique et le développement des compétences.";

export const VISION =
  "Participer à l'émergence d'une société où les compétences, l'innovation, le leadership, l'intégrité et la connaissance constituent des leviers de création de valeur économique, sociale et éthique.";

// Statuts, contexte (reformulation fidèle).
export const CONTEXT = [
  "Le développement du capital humain est devenu un domaine essentiel dans lequel il faut investir pour soutenir la croissance économique des prochaines décennies.",
  "Avec les nouvelles technologies et l'industrialisation, la compétition sur le marché de l'emploi va s'intensifier. Les pays qui y feront face seront ceux qui auront investi dans une main-d'œuvre capable d'affronter la concurrence et de transformer les richesses naturelles en produits utiles à la société.",
  "C'est dans cette perspective que l'Académie du Capital Humain a été créée : pour contribuer à la croissance économique de la République démocratique du Congo.",
];

export const DOMAINS = [
  'Formation initiale', 'Formation continue', 'Formation professionnelle', 'Renforcement des capacités',
  'Accompagnement scientifique', 'Recherche appliquée', 'Leadership', 'Entrepreneuriat',
  'Développement organisationnel', 'Orientation et insertion professionnelle', 'Ressources pédagogiques',
  'Séminaires, conférences et ateliers', 'Mentorat', 'Partenariats scientifiques et professionnels',
];

// Statuts, art. 5 à 11.
export const GOVERNANCE = [
  {
    id: 'fondateurs', name: 'Collège des Fondateurs', article: 'Art. 6',
    role: "Organe de tutelle de l'Académie, composé de tous les membres fondateurs. Il définit la politique et les orientations stratégiques.",
    duties: [
      "Définir la politique, les orientations stratégiques et le développement de l'Académie",
      "Élire et révoquer les membres du Conseil d'administration",
      "Contrôler a priori et a posteriori les actes du Conseil d'administration",
      "Approuver les rapports d'activités, les comptes annuels et le budget",
      'Modifier les statuts et décider la dissolution',
    ],
  },
  {
    id: 'ca', name: "Conseil d'administration", article: 'Art. 7 et 8',
    role: "Assure la gouvernance et l'administration générale. Cinq administrateurs élus pour quatre ans, renouvelables une fois : un président, un vice-président, un secrétaire permanent et deux auditeurs.",
    duties: [
      'Veiller à la bonne exécution des décisions du Collège des Fondateurs par le Comité de gestion',
      'Faire des propositions sur le développement des activités académiques',
      "Délibérer sur l'octroi des diplômes honorifiques",
      'Donner son avis sur les prévisions budgétaires',
      'Élaborer et adopter le règlement intérieur',
    ],
  },
  {
    id: 'cg', name: 'Comité de gestion', article: 'Art. 9 et 10',
    role: "Assure la gestion courante de l'Académie sous la direction du Directeur général. Il comprend le Directeur général, le Secrétaire général, le Secrétaire administratif et l'Administrateur du budget.",
    duties: [
      "Proposer l'organisation des enseignements et la répartition des matières",
      'Proposer les nominations et promotions du personnel',
      'Élaborer et exécuter le budget approuvé',
      'Exercer le pouvoir disciplinaire dans les conditions prévues',
    ],
  },
  {
    id: 'cps', name: 'Conseil pédagogique et scientifique', article: 'Art. 11',
    role: "Organe consultatif composé de personnes compétentes dans les domaines d'intervention de l'Académie.",
    duties: [
      'Formuler des avis sur la qualité des programmes',
      'Conseiller sur les méthodes pédagogiques et les contenus de formation',
      "Conseiller sur l'évaluation et les partenariats académiques",
    ],
  },
  {
    id: 'ce', name: 'Conseil des étudiants', article: 'Art. 5',
    role: "Organe représentant les apprenants. Ses modalités de fonctionnement sont précisées par le règlement intérieur.",
    duties: [],
  },
];

export const FOUNDER_DEFAULTS = {
  name: 'Docteur Michel Muvudi',
  title: 'Fondateur de l’Académie du Capital Humain',
  photo: '/images/fondateur-michel-muvudi.jpg',
  // Source : drmichelmuvudi.com, page « Qui suis-je ? »
  intro:
    "Médecin, économiste et expert en santé publique, avec plus de vingt ans d'expérience dans le développement du capital humain, le leadership transformationnel, la gestion des projets et la réforme des systèmes publics.",
  education: [
    'Docteur en médecine',
    'Master en administration des affaires, Université de Nicosie (Chypre)',
    'Master en santé publique, Université Libre de Bruxelles',
    'Doctorant en leadership dans les réformes publiques',
  ],
  roles: [
    'Fondateur et président du Groupe CIDE Solidarité',
    'Coach en leadership et développement personnel',
    'Auteur et chercheur',
    "Conférencier sur le leadership, la transformation des organisations, la jeunesse et l'impact social",
  ],
  // Message officiel à fournir par l'ACH : rien n'est inventé.
  message: '',
  website: 'https://drmichelmuvudi.com/',
};
