/**
 * Catalogue B20 : formations en présentiel de l'Académie du Capital Humain.
 * Source : « Fiche des formations B20 » (document fourni par l'ACH). Textes repris fidèlement,
 * avec corrections de forme uniquement (fautes de frappe, mentions « [préciser…] » retirées).
 *
 * Ces formations ne sont pas des cours en ligne : elles ne passent pas par la table courses
 * (inscription automatique, leçons, paiement en ligne). L'inscription se fait par demande à l'Académie.
 */

export type B20Domain = 'leadership' | 'entrepreneurship' | 'marketing' | 'finance' | 'human-resources' | 'projets' | 'developpement';

export interface B20Course {
  n: number;
  slug: string;
  title: string;
  tagline?: string;
  domain: B20Domain;
  hours: number;
  pertinence: string[];
  objectives: string[];
  audience: string[];
  method: string;
  modules: (string | { title: string; items: string[] })[];
}

/** Domaines propres au catalogue B20, en plus des catégories de la base. */
export const B20_EXTRA_DOMAINS: { slug: B20Domain; name: string }[] = [
  { slug: 'projets', name: 'Gestion de projets' },
  { slug: 'developpement', name: 'Développement personnel et professionnel' },
];

export const B20_IMAGE: Record<B20Domain, string> = {
  leadership: '/images/photos/mlr.jpg',
  entrepreneurship: '/images/photos/b3.jpg',
  marketing: '/images/photos/cmk.jpg',
  finance: '/images/photos/seg.jpg',
  'human-resources': '/images/photos/cmk-large.jpg',
  projets: '/images/photos/b2.jpg',
  developpement: '/images/photos/b1.jpg',
};

/** Principes communs à toutes les formations (fiche B20, p. 50). */
export const B20_PRINCIPLES = [
  'Des formations pratiques, adaptées au contexte',
  'Un apprentissage fondé principalement sur des études de cas pratiques',
  'Des lectures guidées en complément',
  'La possibilité de poursuivre par un stage pratique',
  'Des horaires et une durée adaptés aux participants',
  'Un certificat remis après un test réussi',
];

/** Les 6 étapes de la méthodologie, communes aux formations du catalogue. */
export const B20_STEPS = [
  { t: 'Introduction aux notions de base', d: 'Poser les fondements du sujet : définitions, concepts clés, contexte et enjeux.' },
  { t: 'Analyse individuelle d’un cas pratique', d: 'Appliquer les notions à un cas réel : besoins, défis, risques, opportunités et solutions possibles.' },
  { t: 'Restitution en groupe des analyses', d: 'Partager les analyses, comparer les approches et formuler des recommandations.' },
  { t: 'Synthèse des principales notions', d: 'Consolider les acquis, clarifier les points clés et répondre aux questions.' },
  { t: 'Coaching ciblé', d: 'Séances individualisées, retour personnalisé et conseils pour appliquer les acquis.' },
  { t: 'Stage de perfectionnement (optionnel)', d: 'Mettre en pratique les compétences en situation professionnelle réelle.' },
];

const PROJ_AUDIENCE = ['Consultants en développement', 'Chargés de projet', 'Gestionnaires de projets', 'Toute personne impliquée dans la conception et la mise en œuvre des projets de développement'];
const LEAD_AUDIENCE = ['Dirigeants, managers et chefs d’équipe', 'Professionnels souhaitant développer leur leadership et leur potentiel', 'Toute personne désireuse de s’épanouir personnellement et professionnellement'];

export const B20: B20Course[] = [
  {
    n: 1, slug: 'leadership-et-performance-organisationnelle', title: 'Leadership et performance organisationnelle', domain: 'leadership', hours: 40,
    pertinence: ['Le leadership joue un rôle primordial dans la performance organisationnelle. Des dirigeants efficaces, capables de motiver, de définir une vision et de cultiver l’excellence, sont des atouts précieux pour toute organisation. Une formation en leadership est un facteur déterminant pour développer ces compétences clés, conduisant à une meilleure performance et à une croissance durable d’une entreprise, d’une nation ou d’une équipe.'],
    objectives: ['Comprendre les notions de leadership', 'Maîtriser la performance organisationnelle', 'Mettre en lien la performance organisationnelle et le leadership', 'Apprendre à construire une culture d’entreprise positive et productive', 'Maîtriser les théories de la performance', 'Mettre en place des outils et des techniques pratiques pour améliorer le leadership et la performance'],
    audience: PROJ_AUDIENCE,
    method: 'Une formation fondée sur l’andragogie et la résolution de problèmes concrets. Les études de cas pratiques placent les participants en situation réelle et favorisent l’acquisition de compétences applicables immédiatement.',
    modules: ['Introduction', 'Le leadership pour la performance', 'La capacité décisionnelle', 'Le consensus', 'Le développement d’une anticipation éclairée', 'La construction d’un système d’anticipation', 'La communication pour la performance', 'Le management pour la performance', 'Les théories de la performance', 'Les cadres de performance', 'Les outils de LPO', 'Exercices intégrés'],
  },
  {
    n: 2, slug: 'redaction-d-un-projet-de-developpement', title: 'Rédaction d’un projet de développement', domain: 'projets', hours: 40,
    pertinence: ['Cette formation vous permettra de maîtriser les concepts fondamentaux de la gestion de projet, de développer une vision stratégique et d’apprendre à élaborer un projet de développement solide et pertinent. Des experts vous guideront à travers des études de cas et des exercices pratiques.', 'À la fin de la formation, vous serez en mesure de défendre votre propre projet de développement devant un jury, démontrant votre maîtrise des concepts et votre capacité à mettre en œuvre des solutions innovantes.'],
    objectives: ['Acquérir une compréhension approfondie des étapes clés de la rédaction d’un projet de développement', 'Développer les compétences nécessaires pour élaborer un projet cohérent, percutant et convaincant', 'Maîtriser les outils et techniques de rédaction d’un projet de développement', 'S’approprier les éléments clés d’un projet de développement réussi'],
    audience: PROJ_AUDIENCE,
    method: 'Une approche active et pratique, en modules thématiques progressifs. Une évaluation formative et une soutenance de projet final valident les acquis ; un accompagnement post-formation assure un suivi continu.',
    modules: ['Définition des concepts de base', 'Analyse des parties prenantes', 'Formulation des objectifs, résultats et activités', 'Formulation des indicateurs', 'Analyse des risques', 'Élaboration d’un budget de projet', 'Élaboration d’un cadre logique', 'Mise en œuvre, suivi et évaluation d’un projet de développement', 'Financement d’un projet de développement (sources, modalités)', 'Élaboration d’un projet de développement'],
  },
  {
    n: 3, slug: 'gestion-d-un-projet-de-developpement', title: 'Gestion d’un projet de développement', tagline: 'De l’idée à la concrétisation', domain: 'projets', hours: 40,
    pertinence: ['Une formation pratique et immersive. Confrontés à des études de cas réels, vous explorerez l’ensemble du cycle de vie d’un projet, de la conception à la mise en œuvre. Des experts vous accompagneront pour identifier et analyser les défis propres à la gestion de projets de développement, définir des solutions et des stratégies performantes, maîtriser la gestion des équipes, des ressources et des budgets, et surmonter les obstacles et les imprévus.'],
    objectives: ['Acquérir une compréhension approfondie des étapes clés d’un projet de développement', 'Développer les compétences nécessaires pour piloter un projet cohérent et performant', 'Maîtriser les outils et techniques de gestion d’un projet de développement', 'S’approprier les éléments clés d’un projet de développement réussi'],
    audience: PROJ_AUDIENCE,
    method: 'Une approche active et pratique, en modules thématiques progressifs. Une évaluation formative et une soutenance de projet final valident les acquis ; un accompagnement post-formation assure un suivi continu.',
    modules: ['Généralités sur les notions de projet', 'Structure organisationnelle d’un projet', 'Constitution d’une équipe de projet', 'Cycle de vie d’un projet', 'Mettre en place un organigramme', 'Planning', 'Suivi des coûts', 'Gestion des risques dans un projet', 'Communication dans un projet', 'Mise en place des tableaux de bord', 'Prévention des fraudes', 'Cas d’étude'],
  },
  {
    n: 4, slug: 'suivi-et-evaluation-d-un-projet-de-developpement', title: 'Suivi et évaluation d’un projet de développement', tagline: 'Maîtrisez les outils et techniques pour un suivi et une évaluation efficaces de vos projets', domain: 'projets', hours: 40,
    pertinence: ['Cette formation pratique vous permettra de maîtriser les techniques de suivi et d’évaluation de projets de développement. Grâce à des études de cas réels, vous découvrirez les outils et méthodes les plus performants pour assurer un suivi continu et des évaluations ponctuelles efficaces, en adaptant vos stratégies aux différents contextes et en appliquant les connaissances acquises à votre propre travail.'],
    objectives: ['Acquérir une compréhension approfondie des concepts de suivi et d’évaluation des projets de développement', 'Développer les compétences nécessaires pour mettre en place un système de suivi et d’évaluation performant', 'Maîtriser les outils et techniques de suivi et d’évaluation des projets', 'Analyser les résultats et les impacts des projets de développement', 'Formuler des recommandations pour l’amélioration des projets'],
    audience: ['Consultants en développement', 'Chargés de projet', 'Gestionnaires de projets', 'Responsables de suivi et d’évaluation', 'Toute personne impliquée dans la gestion et le suivi des projets de développement'],
    method: 'Une approche active et pratique : études de cas, exercices et simulations. Une évaluation formative et une soutenance de projet final valident les acquis ; un accompagnement post-formation assure un suivi continu.',
    modules: ['Concepts et considérations du suivi', 'Concepts clés de l’évaluation', 'Cadre de suivi et évaluation', 'Étapes clés du suivi et évaluation des projets', 'Portée du suivi et évaluation', 'Collecte et gestion des données', 'Analyse des données', 'Utilisation des informations', 'Prise de décision dans le suivi et évaluation', 'Cas d’étude'],
  },
  {
    n: 5, slug: 'creation-d-une-entreprise-ou-d-une-ong', title: 'Création d’une entreprise ou d’une ONG', tagline: 'De l’idée à la réalisation', domain: 'entrepreneurship', hours: 40,
    pertinence: ['Cette formation pratique vous prépare à lancer votre propre entreprise ou ONG. Elle vous guide à travers les étapes clés de la création et vous permet de maîtriser les aspects juridiques, administratifs et techniques. Vous apprendrez à élaborer un plan d’affaires, à gérer les finances, à développer une stratégie marketing et à surmonter les défis, grâce à des simulations et des études de cas réalistes.'],
    objectives: ['Comprendre les étapes clés de la création d’une entreprise ou d’une ONG', 'Développer les compétences nécessaires pour élaborer un plan d’affaires solide et convaincant', 'Identifier les ressources et les financements disponibles', 'Maîtriser les aspects juridiques et administratifs de la création d’une entité', 'Définir une stratégie de marketing et de communication efficace'],
    audience: ['Entrepreneurs en herbe', 'Personnes souhaitant créer une ONG', 'Salariés souhaitant se lancer en indépendant', 'Toute personne intéressée par la création d’une nouvelle entité'],
    method: 'Une approche active et interactive : études de cas réels, exercices pratiques et simulations. Des experts guident les participants à chaque étape de la création. Une évaluation finale valide les acquis.',
    modules: ['Définition du projet et du marché', 'Création juridique et administrative', 'Montage financier', 'Montage logistique', 'Techniques de montage', 'Cas pratique (création d’une entreprise dans un domaine précis, gestion d’une situation d’urgence pour une ONG)'],
  },
  {
    n: 6, slug: 'gestion-et-developpement-d-une-entreprise-ou-d-une-ong', title: 'Gestion et développement d’une entreprise ou d’une ONG', tagline: 'Piloter la croissance', domain: 'entrepreneurship', hours: 30,
    pertinence: ['Cette formation pratique vous permettra de développer les compétences de leadership essentielles à une gestion efficace et à une croissance durable. Des études de cas réels vous plongeront dans des situations professionnelles concrètes. À l’issue de la formation, vous serez capable d’élaborer un plan d’affaires solide, de gérer les finances, de développer des stratégies marketing, de mettre en place une gestion des ressources humaines performante et d’identifier de nouvelles opportunités de croissance.'],
    objectives: ['Acquérir une compréhension approfondie des principes de gestion et de développement d’une entreprise ou d’une ONG', 'Développer les compétences nécessaires pour diriger et faire grandir une organisation', 'Maîtriser les outils et techniques de gestion stratégique, opérationnelle et financière', 'Identifier les défis et les opportunités du marché et développer une stratégie de croissance', 'Concevoir et mettre en œuvre des plans de développement durables et responsables'],
    audience: ['Dirigeants d’entreprises et d’ONG', 'Gestionnaires et responsables', 'Entrepreneurs et fondateurs', 'Toute personne désireuse de développer ses compétences en gestion et développement organisationnel'],
    method: 'Une formation interactive et pratique : études de cas réels, exercices concrets, simulations et travail en équipe. Des évaluations régulières et une soutenance finale valident les acquis ; un accompagnement post-formation aide à les appliquer.',
    modules: ['Gestion opérationnelle (administrative et technique)', 'Gestion financière', 'Stratégie de développement', 'Cycle de vie d’un projet', 'Cas pratique (application des outils en contexte réel, résolution de problèmes et prise de décision, analyse des résultats)'],
  },
  {
    n: 7, slug: 'financement-base-sur-la-performance-fbp', title: 'Financement basé sur la performance (FBP)', domain: 'finance', hours: 40,
    pertinence: ['Cette formation pratique vous guidera à travers des modèles innovants pour améliorer l’efficacité et la performance. Vous explorerez des cas concrets de différents secteurs et pays, et développerez les compétences nécessaires pour concevoir et mettre en œuvre des initiatives innovantes, en apprenant des meilleures pratiques pour optimiser la performance des services publics et améliorer la vie des citoyens.'],
    objectives: ['Comprendre les concepts fondamentaux du FBP et ses applications dans différents contextes', 'Développer les compétences nécessaires pour concevoir et mettre en œuvre des programmes de FBP efficaces', 'Maîtriser les outils et les techniques de mesure de la performance et de la valeur pour le FBP', 'Analyser les résultats et les impacts des programmes de FBP', 'Formuler des recommandations pour améliorer la conception et la mise en œuvre des programmes de FBP'],
    audience: ['Consultants en développement', 'Chargés de projets', 'Gestionnaires de programmes de développement', 'Responsables de financement', 'Toute personne impliquée dans la conception, la mise en œuvre et l’évaluation des programmes de développement'],
    method: 'Une approche active et pratique : études de cas réels, exercices concrets et simulations, en modules progressifs. Une évaluation formative et une évaluation finale valident les acquis ; un accompagnement post-formation assure un suivi continu.',
    modules: ['Concepts de base du FBP', 'Les fonctions du FBP', 'La contractualisation dans le FBP', 'La régulation dans le FBP', 'La vérification dans le FBP', 'La prestation dans le FBP', 'L’achat des services dans le FBP', 'Les outils du FBP', 'Monter un programme FBP', 'Cas pratique'],
  },
  {
    n: 8, slug: 'plaidoyer-et-mobilisation-des-fonds', title: 'Plaidoyer et mobilisation des fonds', tagline: 'Devenez des champions de l’impact', domain: 'finance', hours: 40,
    pertinence: ['Développez votre capacité à mobiliser des ressources et à faire rayonner votre organisation. Cette formation pratique vous permettra de maîtriser les techniques de mobilisation de ressources domestiques et internationales, de créer des messages percutants, de développer une stratégie de communication efficace et d’attirer des partenaires et des donateurs.', 'Vous apprendrez à négocier, à gérer les relations publiques et à mettre en pratique vos connaissances grâce à des études de cas réels et des simulations.'],
    objectives: ['Comprendre les concepts clés du plaidoyer et de la mobilisation des fonds', 'Développer les compétences nécessaires pour mener des campagnes de plaidoyer efficaces', 'Maîtriser les techniques de recherche de financement et de rédaction de propositions de projets', 'Élaborer des stratégies de communication et de plaidoyer efficaces', 'Renforcer les capacités de négociation et de plaidoyer auprès des donateurs', 'Identifier les sources de financement les plus pertinentes'],
    audience: ['Activistes', 'Responsables de programmes et de projets', 'Chargés de communication', 'Leaders d’ONG et d’organisations à but non lucratif', 'Toute personne désireuse de développer ses compétences en plaidoyer et en mobilisation des fonds'],
    method: 'Une démarche en six étapes, de l’introduction aux notions de base jusqu’au stage de perfectionnement, fondée sur l’étude de cas réels de plaidoyer et de recherche de financement.',
    modules: ['Généralités sur le plaidoyer', 'Développer un plan de plaidoyer', 'Gestion du plaidoyer', 'Mobilisation des fonds : stratégies', 'Identification des sources de financement', 'Cas pratique'],
  },
  {
    n: 9, slug: 'gestion-du-temps', title: 'Gestion du temps', tagline: 'Maîtrisez votre temps et boostez votre performance en situation de stress', domain: 'developpement', hours: 40,
    pertinence: ['Cette formation pratique vous aidera à identifier les techniques de gestion du temps les plus efficaces, à gérer les interruptions et les priorités, à organiser votre travail et à surmonter le stress. Vous apprendrez à améliorer votre concentration, votre organisation et votre capacité à gérer les priorités, avec des solutions concrètes issues d’études de cas réels.'],
    objectives: ['Comprendre les principes fondamentaux de la gestion du temps', 'Identifier les facteurs qui influencent la gestion du temps et les obstacles à surmonter', 'Développer des techniques et des stratégies pour organiser son temps et ses priorités', 'Apprendre à utiliser des outils et des méthodes de gestion du temps', 'Surmonter le stress et l’anxiété liés à la gestion du temps', 'Améliorer l’efficacité, la productivité et la concentration'],
    audience: ['Professionnels de tous secteurs', 'Étudiants', 'Toute personne désireuse d’améliorer sa gestion du temps et son organisation'],
    method: 'Un apprentissage interactif et participatif : études de cas réels, simulations, présentation d’outils et de logiciels de gestion du temps. Évaluation continue et suivi post-formation.',
    modules: ['Principes fondamentaux de la gestion du temps', 'Optimiser son environnement de travail', 'Gérer la paperasse électronique et papier', 'Les outils de gestion', 'Planification et priorisation', 'La gestion des tâches', 'Les gestionnaires de temps', 'Déléguer de façon efficace', 'Optimiser ses déplacements', 'Cas pratique'],
  },
  {
    n: 10, slug: 'intelligence-emotionnelle-en-entreprise', title: 'Intelligence émotionnelle en entreprise', domain: 'leadership', hours: 40,
    pertinence: ['Cette formation pratique vous aidera à identifier les compétences émotionnelles clés, à gérer vos émotions, à communiquer efficacement, à motiver et inspirer les autres, à surmonter le stress et à améliorer votre leadership. Exercices pratiques, simulations et études de cas réels vous permettront de développer des techniques concrètes.'],
    objectives: ['Comprendre les concepts clés de l’intelligence émotionnelle et son importance en entreprise', 'Développer les compétences émotionnelles essentielles pour réussir dans un environnement professionnel', 'Améliorer la communication et les relations interpersonnelles', 'Gérer les émotions et le stress de manière efficace', 'Renforcer le leadership, la confiance en soi et la capacité à gérer les conflits', 'Stimuler la motivation et l’engagement des équipes'],
    audience: ['Managers, dirigeants, chefs d’équipe', 'Professionnels souhaitant développer leurs compétences relationnelles', 'Toute personne désireuse d’améliorer sa performance et son leadership'],
    method: 'Une approche active et collaborative : études de cas, exercices pratiques, jeux de rôles et simulations immersives. Modules progressifs, évaluations régulières et suivi post-formation.',
    modules: ['Généralités sur l’intelligence émotionnelle', 'Généralités sur les émotions', 'Importance de l’intelligence émotionnelle en entreprise', 'Se connaître soi-même', 'Développer la maîtrise de soi en entreprise', 'Connaître les autres en entreprise', 'Gérer les relations et les conflits en entreprise', 'L’inventaire des compétences émotionnelles', 'Utiliser l’intelligence émotionnelle pour améliorer les performances de l’entreprise', 'Cas pratique (gérer un conflit au sein d’une équipe, développer une stratégie de communication positive…)'],
  },
  {
    n: 11, slug: 'redaction-des-outils-de-travail', title: 'Rédaction des outils de travail', domain: 'developpement', hours: 40,
    pertinence: ['Maîtrisez les outils essentiels pour réussir votre carrière. Cette formation pratique vous permettra de développer des CV et lettres de motivation percutants, de rédiger des rapports et des termes de référence professionnels, et d’élaborer des discours captivants. Vous apprendrez des techniques de rédaction et de mise en forme efficaces pour tous vos documents professionnels.'],
    objectives: ['Acquérir les compétences nécessaires pour rédiger des documents professionnels clairs, concis et convaincants', 'Maîtriser les techniques de rédaction et de mise en forme pour différents types de documents', 'Adapter son style de rédaction à différents publics et contextes', 'Utiliser des outils et des ressources pour améliorer la qualité de la rédaction', 'Renforcer la crédibilité et le professionnalisme de sa communication écrite'],
    audience: ['Professionnels de tous secteurs', 'Étudiants', 'Toute personne désireuse d’améliorer ses compétences en rédaction professionnelle'],
    method: 'Exercices, simulations et études de cas réels, présentation d’outils et de logiciels de rédaction. Évaluations régulières et suivi post-formation.',
    modules: ['Rédaction d’un CV', 'Rédaction d’une lettre de motivation', 'Rédaction de termes de référence', 'Rédaction d’un rapport de mission', 'Rédaction d’un plan de travail', 'Rédaction d’un rapport de réunion', 'Rédaction d’un rapport d’atelier', 'Rédaction d’une feuille de route', 'Rédaction d’un compte rendu', 'Rédaction d’un mémorandum', 'Rédaction d’un briefing', 'Rédaction d’un discours', 'Rédaction d’une note conceptuelle', 'Rédaction d’une présentation PowerPoint', 'Rédaction d’un rapport d’activité', 'Rédaction d’une note technique', 'Rédaction d’un procès-verbal', 'Rédaction d’un e-mail', 'Exercices pratiques sur chaque outil'],
  },
  {
    n: 12, slug: 'economie-positive', title: 'Économie positive', tagline: 'Leadership, capital humain, développement personnel', domain: 'developpement', hours: 40,
    pertinence: ['Cette formation pratique vous guidera dans l’identification de vos forces et de vos passions pour construire un plan de développement personnel. Vous apprendrez à maximiser vos compétences, à définir des objectifs clairs, à utiliser les outils pour investir dans votre capital humain et à développer votre leadership, grâce à des exercices pratiques, des simulations et des outils d’évaluation.'],
    objectives: ['Comprendre les principes fondamentaux de l’économie positive et son application aux organisations et aux individus', 'Développer des compétences de leadership inspirantes et positives', 'Renforcer le capital humain et favoriser un environnement de travail positif et performant', 'Stimuler le développement personnel et le bien-être des individus', 'Mettre en place des stratégies de gestion et d’organisation fondées sur les principes de l’économie positive'],
    audience: LEAD_AUDIENCE,
    method: 'Une formation interactive et personnalisée : exercices pratiques, simulations et outils d’auto-évaluation pour identifier vos forces, vos valeurs et vos aspirations, puis construire votre plan de développement personnel.',
    modules: ['Généralités sur l’économie positive', 'Le leadership', 'L’intelligence émotionnelle', 'Gérer sa vie comme une entreprise', 'Gérer sa vie comme un capital', 'Le capital humain', 'L’ordonnance de vie', 'Les outils d’économie positive : SAV, ICE, PDP', 'Cas pratiques'],
  },
  {
    n: 13, slug: 'gestion-des-ressources', title: 'Gestion des ressources', domain: 'human-resources', hours: 40,
    pertinence: ['Cette formation pratique vous permettra de maîtriser les techniques de gestion des ressources humaines, financières et matérielles. Vous découvrirez des outils et des méthodes simples et performants pour optimiser l’utilisation de vos ressources, prendre des décisions éclairées, gérer les budgets et optimiser vos équipes et vos opérations.'],
    objectives: ['Comprendre les fondamentaux de la gestion des ressources', 'Développer des compétences pratiques', 'Améliorer l’efficacité organisationnelle', 'Encourager l’innovation et la créativité', 'Renforcer le leadership et la gestion des conflits'],
    audience: LEAD_AUDIENCE,
    method: 'Séances théoriques, discussions de groupe et ateliers pratiques ; études de cas réels et simulations ; outils numériques pour faciliter la collaboration ; interventions d’experts.',
    modules: ['Généralités sur la gestion des ressources', 'Gestion des ressources humaines', 'Gestion des ressources financières', 'Gestion des ressources matérielles', 'Gestion du temps', 'Cas d’étude'],
  },
  {
    n: 14, slug: 'gestion-des-equipes', title: 'Gestion des équipes', domain: 'leadership', hours: 30,
    pertinence: ['Cette formation pratique vous permettra de développer des compétences essentielles en gestion d’équipe, en particulier la gestion des conflits et des émotions en milieu professionnel. Vous acquerrez des outils et des techniques éprouvés pour résoudre les conflits, réguler les émotions de votre équipe et favoriser un environnement de travail positif et collaboratif.'],
    objectives: ['Comprendre les fondamentaux de la gestion des équipes', 'Développer des compétences pratiques en leadership et en gestion des conflits', 'Améliorer l’efficacité organisationnelle', 'Encourager l’innovation et la créativité au sein des équipes', 'Renforcer les capacités de leadership des managers et chefs d’équipe'],
    audience: LEAD_AUDIENCE,
    method: 'Séances théoriques, discussions de groupe et ateliers pratiques ; études de cas réels et simulations ; interventions d’experts et séances de questions-réponses.',
    modules: ['Généralités sur la gestion d’une équipe', 'Défis de la gestion d’une équipe', 'Vision, mission et valeurs d’une équipe', 'Gestion du rendement d’une équipe', 'Évaluation du gestionnaire', 'Cadre de performance d’une équipe', 'Outils de gestion d’une équipe', 'Cas d’étude'],
  },
  {
    n: 15, slug: 'sante-et-bien-etre-au-travail', title: 'Santé et bien-être au travail', tagline: 'Préserver la santé et le bien-être de vos équipes', domain: 'human-resources', hours: 20,
    pertinence: ['Cette formation approfondie vise à doter les responsables et professionnels de compétences concrètes pour promouvoir la santé, la sécurité et le bien-être de leurs équipes en milieu de travail. Vous apprendrez à concevoir et à mettre en œuvre des programmes axés sur le bien-être physique, mental et émotionnel de vos collaborateurs.'],
    objectives: ['Comprendre les impacts de l’environnement de travail sur la santé et le bien-être des employés', 'Développer des stratégies de prévention et de gestion du stress, de l’épuisement professionnel et des troubles musculo-squelettiques', 'Acquérir des techniques d’accompagnement et de soutien psychosocial', 'Créer une culture d’entreprise favorisant l’engagement, la motivation et la performance durable', 'Mesurer et suivre les indicateurs clés de santé et de bien-être au travail'],
    audience: ['Dirigeants, responsables des ressources humaines et managers', 'Professionnels de la santé et de la sécurité au travail', 'Toute personne impliquée dans la gestion et le bien-être des équipes'],
    method: 'Apports théoriques, études de cas pratiques, ateliers interactifs et témoignages d’experts, avec un accompagnement personnalisé pour mettre en place des initiatives adaptées à votre organisation.',
    modules: ['Généralités sur la santé et le bien-être au travail', 'Gestion du stress au travail', 'Gestion du sommeil', 'Intelligence émotionnelle au travail', 'Environnement social, physique et mental au travail', 'Prévention et gestion des accidents du travail', 'Cas d’études'],
  },
  {
    n: 16, slug: 'entrepreneuriat-medical', title: 'Entrepreneuriat médical', domain: 'entrepreneurship', hours: 50,
    pertinence: ['Cette formation pratique vous aidera à identifier des opportunités d’investissement prometteuses dans le secteur de la santé, à monter des projets innovants et viables et à élaborer des plans d’affaires convaincants. Vous apprendrez à analyser le marché, à mobiliser les ressources et à obtenir le financement nécessaire, à partir d’exemples concrets de réussites.'],
    objectives: ['Comprendre les spécificités de l’entrepreneuriat médical et les défis à relever', 'Acquérir les connaissances et compétences nécessaires pour lancer et gérer une entreprise de santé', 'Développer un plan d’affaires solide et pertinent pour le secteur médical', 'Maîtriser les aspects juridiques, administratifs et financiers de la création d’une entreprise de santé', 'Identifier les opportunités de marché et les tendances du secteur de la santé', 'Élaborer une stratégie marketing et de communication efficace pour le secteur médical', 'Développer les compétences en leadership et en gestion d’équipe'],
    audience: ['Dirigeants, responsables des ressources humaines et managers', 'Professionnels de la santé et de la sécurité au travail', 'Toute personne impliquée dans la gestion et le bien-être des équipes'],
    method: 'Une approche pratique et interactive : études de cas réels, exercices et simulations. Des experts guident les participants à travers les étapes de la création d’un projet de santé. Une évaluation finale valide les acquis.',
    modules: [
      'Généralités sur l’entrepreneuriat médical', 'Pourquoi l’entrepreneuriat médical', 'Le système de santé de la RDC', 'Les piliers du système de santé',
      { title: 'Les projets médicaux', items: ['Créer et développer un centre de santé', 'Créer et développer un hôpital', 'Créer et développer une pharmacie', 'Développer un système de soins à domicile', 'Développer un système de soins des maladies chroniques', 'Développer une assurance maladie ou une mutuelle de santé', 'Développer un service de référence vers les spécialistes', 'Développer un service d’évacuation des références', 'Mettre en place un réseau d’ambulances', 'Développer un système de gestion et d’accréditation des ressources humaines', 'Créer un service de distribution des produits de santé', 'Créer une application digitale pour le suivi des malades', 'Créer un système de médecin de famille', 'Créer un système d’appui-conseil à distance', 'Créer un service scolaire de soins de santé', 'Créer un service d’accréditation des structures de santé', 'Créer un service de formation des agents de santé'] },
    ],
  },
  {
    n: 17, slug: 'developpement-professionnel', title: 'Développement professionnel', domain: 'developpement', hours: 30,
    pertinence: ['Cette formation vous permettra d’optimiser vos performances et de faire progresser votre carrière. Vous acquerrez des techniques éprouvées pour améliorer votre productivité, développer vos compétences de leadership et saisir les opportunités d’avancement. Elle s’adresse aussi bien aux jeunes diplômés qu’aux cadres expérimentés souhaitant faire évoluer leur carrière au sein de leur institution.'],
    objectives: ['Comprendre les principes fondamentaux du développement professionnel et son application aux organisations et aux individus', 'Développer des compétences de leadership inspirantes et positives', 'Renforcer le capital humain et favoriser un environnement de travail positif et performant', 'Stimuler le développement professionnel et le bien-être des individus', 'Mettre en place des stratégies de gestion et d’organisation fondées sur les principes du développement professionnel'],
    audience: LEAD_AUDIENCE,
    method: 'Une approche interactive et pratique : exposés dynamiques, discussions, exercices et simulations, études de cas réels, jeux de rôles et partage d’expériences en groupe, complétés par des techniques de visualisation et de réflexion personnelle.',
    modules: ['Généralités sur le développement professionnel', 'Comprendre son métier', 'Comprendre son organisation', 'Identifier les opportunités', 'Développer son capital humain', 'Développer son intelligence émotionnelle', 'Savoir se mettre en valeur', 'Planifier ses progrès', 'Les 5 pièges à éviter', 'Cas d’études'],
  },
  {
    n: 18, slug: 'entrepreneuriat', title: 'Entrepreneuriat', domain: 'entrepreneurship', hours: 50,
    pertinence: ['Cette formation pratique vous guidera à travers les étapes essentielles pour lancer votre propre entreprise dans divers secteurs. Vous découvrirez toute la chaîne entrepreneuriale, en mettant l’accent sur les défis que rencontrent les entrepreneurs dans les conditions actuelles du marché. Elle s’adresse aux aspirants entrepreneurs comme aux chefs d’entreprise en quête d’innovation et d’expansion.'],
    objectives: ['Comprendre les concepts clés de l’entrepreneuriat', 'Identifier les opportunités commerciales viables', 'Élaborer un plan d’affaires solide', 'Acquérir des compétences en gestion financière et en marketing', 'Développer des stratégies pour relever les défis entrepreneuriaux actuels'],
    audience: ['Futurs entrepreneurs', 'Jeunes diplômés souhaitant créer leur entreprise', 'Chefs de petites entreprises cherchant à se développer', 'Professionnels en reconversion souhaitant se lancer dans l’entrepreneuriat'],
    method: 'Exposés et discussions, études de cas réels, ateliers pratiques et jeux de rôles, coaching individuel et réseautage entre aspirants entrepreneurs.',
    modules: ['Généralités sur l’entreprise', 'L’entreprise et son environnement', 'L’entrepreneur', 'L’étude du marché', 'Stratégie marketing', 'Marketing mix', 'Chiffre d’affaires et étude technique', 'Business plan', 'Cas d’études'],
  },
  {
    n: 19, slug: 'marketing', title: 'Marketing', tagline: 'Promotion d’un produit, d’un service ou d’une personne', domain: 'marketing', hours: 30,
    pertinence: ['Cette formation vous permettra de maîtriser le marketing en intégrant des techniques de communication efficaces et des approches innovantes. Vous apprendrez à créer des campagnes percutantes, à comprendre les comportements des consommateurs et à adapter votre offre aux tendances actuelles. Elle s’adresse aussi bien aux débutants qu’aux professionnels expérimentés.'],
    objectives: ['Comprendre les fondamentaux du marketing et son évolution', 'Développer des compétences en communication et en branding', 'Analyser le comportement des consommateurs et les tendances du marché', 'Concevoir et exécuter des stratégies marketing efficaces', 'Intégrer les innovations technologiques et digitales dans le marketing'],
    audience: ['Responsables marketing', 'Entrepreneurs et chefs de petites entreprises', 'Professionnels du marketing souhaitant se spécialiser ou se perfectionner', 'Étudiants en marketing'],
    method: 'Exposés interactifs, discussions, études de cas réels, ateliers et jeux de rôles, coaching individuel et simulations de marché.',
    modules: ['Généralités sur le marketing', 'Élaborer un plan marketing', 'Marketing digital', 'Marketing relationnel', 'Le big data', 'Marketing et leadership', 'Marketing et management', 'Conseils pratiques en marketing', 'Cas d’études'],
  },
  {
    n: 20, slug: 'fondamentaux-du-management-des-organisations', title: 'Les fondamentaux du management des organisations', domain: 'leadership', hours: 30,
    pertinence: ['Cette formation vous permettra d’acquérir et de consolider vos compétences en management à travers l’étude des dimensions clés du management : planification, organisation, mise en œuvre, suivi et évaluation. Chaque dimension est illustrée par des études de cas concrets afin de rapprocher les concepts théoriques de la réalité du terrain.'],
    objectives: ['Comprendre les principes fondamentaux du management des organisations', 'Développer des compétences en planification stratégique et organisationnelle', 'Mettre en œuvre des techniques efficaces de gestion d’équipe et de projet', 'Maîtriser le suivi et l’évaluation de la performance organisationnelle', 'Adapter les styles de management aux différents contextes et cultures organisationnelles'],
    audience: ['Managers et chefs d’équipe en activité', 'Jeunes diplômés en management et gestion', 'Professionnels cherchant à évoluer vers des postes de direction', 'Entrepreneurs et chefs de petites entreprises'],
    method: 'Une approche intégrative orientée vers la pratique : exposés interactifs, discussions dirigées, études de cas réels, simulations, ateliers, jeux de rôles, coaching individualisé et feedback continu.',
    modules: ['Généralités sur le management', 'Généralités sur la dynamique des organisations', 'Gestion des organisations', 'Management des relations humaines', 'Le capital humain d’une organisation', 'Les fonctions du management', 'Communication organisationnelle', 'Cadre de performance organisationnelle', 'Cas d’études'],
  },
];

export const findB20 = (slug: string) => B20.find((c) => c.slug === slug);

/** Recherche simple dans le titre, l'accroche, les objectifs et les modules. */
export function searchB20(query: string, domain?: string): B20Course[] {
  const q = query.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return B20.filter((c) => (!domain || c.domain === domain) && (!q || norm([c.title, c.tagline ?? '', ...c.objectives, ...c.modules.map((m) => (typeof m === 'string' ? m : m.title))].join(' ')).includes(q)));
}
