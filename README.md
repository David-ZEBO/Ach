# Site de l'Académie du Capital Humain (ACH)

Site public et espace apprenant de l'ACH, reconstruit en React + TypeScript (Vite) sur la base Supabase **existante** (projet `itkttienhygovmhbkmxx`). Aucune table, migration ou politique de sécurité n'a été créée ou modifiée.

## Démarrer

```bash
cp .env.example .env   # renseigner l'URL et la clé publique « anon » du projet Supabase
npm install
npm run dev            # http://localhost:5173 (port déclaré dans les redirections Supabase)
npm run build          # vérifie les types puis génère dist/
```

## Organisation

```
src/
  lib/          supabase.ts (client), api.ts (toutes les requêtes), content.ts (textes institutionnels issus des statuts),
                auth.tsx (session), images.ts (correspondance des anciennes images), useFounder.ts, hooks.ts, format.ts
  components/   Header, Footer, ui (cartes, en-têtes de page, états vides), ContactForm, ApplicationForm, Icon
  pages/        Accueil, L'Académie, Fondateur, Gouvernance, Formations, Formation, Admissions, Entreprises,
                Recherche, Actualités, Contact, Vérifier, Connexion, Espace, pages légales
  styles/       global.css (design system ACH), pages.css
```

## Ce que le site utilise dans la base

| Besoin | Source existante |
|---|---|
| Catalogue | fonction `catalog_search` (accès visiteur) |
| Page formation | tables `courses`, `course_translations`, `modules`, `lessons` (RLS : formations publiées visibles par tous) |
| Domaines | `categories` + `category_translations` |
| Programmes / candidatures | `programmes`, insertion dans `programme_applications` (apprenant connecté, programme au statut `open`) |
| Inscription gratuite | fonction `enroll_free_course` |
| Contact et demandes des organisations | fonction `submit_contact_message` (sujet `organization`) |
| Vérification de documents | fonctions `verify_certificate`, `verify_diploma` |
| FAQ | `faq_items` + `faq_item_translations` |
| Publications | `resources` (visibilité `public`) |
| Contenu du fondateur (administrable) | `site_settings`, clés publiques `founder.intro`, `founder.message`, `founder.photo`, `founder.education`, `founder.roles` |

## Réglages

- `SHOW_DEMO_COURSES` (src/lib/api.ts) : `true`, toutes les formations publiées sont publiques, y compris celles marquées `is_demo`.
- Coordonnées (e-mail, téléphone, réseaux sociaux) : `ACH` dans src/lib/content.ts. Laissées vides tant qu'elles ne sont pas communiquées officiellement.

## Reste à reconstruire

Les fonctions côté base existent déjà ; seules les interfaces sont à refaire :

- Espace étudiant complet : `get_student_dashboard`, `get_course_space`, `record_lesson_progress`, `submit_quiz_attempt`, `submit_assignment`, `get_my_grades`, `issue_certificate`, messagerie, notifications.
- Paiement des formations payantes : fonctions serveur (Edge Functions) `checkout` et `payment-verify`, `request_course_enrollment` (mobile money).
- Dossier de candidature après présélection : `save_application_dossier`, `register_application_document`, `submit_application_dossier`.
- Espace formateur : `get_teacher_dashboard`, `grade_submission`, `get_gradebook`.
- Administration : fonctions `admin_*`.
- Page de réinitialisation du mot de passe (`/reset-password`).
