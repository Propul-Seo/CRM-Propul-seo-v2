-- ============================================================
-- Seed : Fiche "Acheter un nom de domaine sur Namecheap"
-- ============================================================
-- À appliquer APRÈS la migration 20260424_procedures_module.sql
-- ============================================================

INSERT INTO public.procedures (
  title,
  slug,
  category_id,
  tags,
  summary,
  content,
  content_text
)
SELECT
  'Acheter un nom de domaine sur Namecheap',
  'acheter-nom-de-domaine-namecheap',
  (SELECT id FROM public.procedure_categories WHERE slug = 'noms-de-domaine'),
  ARRAY['namecheap','domaine','achat','client'],
  'Procédure pas à pas pour acheter un nom de domaine sur Namecheap et récupérer les codes d''accès client.',
  $jsonb${
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Voici comment acheter ton nom de domaine sur Namecheap, pas à pas." }
        ]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Étapes" }]
      },
      {
        "type": "orderedList",
        "attrs": { "start": 1 },
        "content": [
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "Va sur " },
                  {
                    "type": "text",
                    "marks": [
                      {
                        "type": "link",
                        "attrs": { "href": "https://www.namecheap.com", "target": "_blank", "rel": "noopener noreferrer" }
                      }
                    ],
                    "text": "https://www.namecheap.com"
                  }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "Dans la barre de recherche, tape le nom de domaine que tu souhaites." }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "Choisis l'extension (.fr, .com, .net…)." }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          { "type": "text", "text": "France → .fr ou .com sont les plus courants." }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "Clique sur " },
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "Add to cart" },
                  { "type": "text", "text": " en face du domaine choisi." }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "Ouvre le panier (icône 🛒 en haut à droite)." }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          { "type": "text", "text": "Laisse la " },
                          { "type": "text", "marks": [{ "type": "bold" }], "text": "protection des données (Whois/Privacy)" },
                          { "type": "text", "text": " activée — elle est gratuite chez Namecheap." }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          { "type": "text", "text": "Choisis la durée (1 an suffit au départ) et active " },
                          { "type": "text", "marks": [{ "type": "bold" }], "text": "Auto-renew" },
                          { "type": "text", "text": " pour éviter l'expiration." }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "Clique " },
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "Checkout" },
                  { "type": "text", "text": "." }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "Crée ton compte Namecheap (ou connecte-toi si tu en as déjà un)." }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "Renseigne tes informations, puis paie (carte / PayPal)." }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "Ouvre l'email de confirmation et valide ton adresse (obligatoire pour activer le domaine)." }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "Une fois payé :" }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          { "type": "text", "text": "Va dans " },
                          { "type": "text", "marks": [{ "type": "bold" }], "text": "Dashboard → Domain List" },
                          { "type": "text", "text": " et vérifie que le domaine est " },
                          { "type": "text", "marks": [{ "type": "bold" }], "text": "Active" },
                          { "type": "text", "text": "." }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "type": "blockquote",
        "content": [
          {
            "type": "paragraph",
            "content": [
              { "type": "text", "text": "👉 Quand c'est fait, envoie-moi simplement tes codes d'accès à ton compte Namecheap." }
            ]
          }
        ]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Petites astuces" }]
      },
      {
        "type": "bulletList",
        "content": [
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "Si le nom exact est pris, teste les variantes (avec / sans tiret, autre extension .fr / .com)." }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "Garde " },
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "Auto-renew" },
                  { "type": "text", "text": " activé et active la " },
                  { "type": "text", "marks": [{ "type": "bold" }], "text": "double authentification" },
                  { "type": "text", "text": " dans ton compte pour la sécurité." }
                ]
              }
            ]
          }
        ]
      }
    ]
  }$jsonb$::jsonb,
  -- content_text : version plain-text pour la recherche FTS
  'Voici comment acheter ton nom de domaine sur Namecheap, pas à pas. Étapes. '
  'Va sur https://www.namecheap.com. '
  'Dans la barre de recherche, tape le nom de domaine que tu souhaites. '
  'Choisis l''extension (.fr, .com, .net). France .fr ou .com sont les plus courants. '
  'Clique sur Add to cart en face du domaine choisi. '
  'Ouvre le panier (icône en haut à droite). '
  'Laisse la protection des données (Whois Privacy) activée — elle est gratuite chez Namecheap. '
  'Choisis la durée (1 an suffit au départ) et active Auto-renew pour éviter l''expiration. '
  'Clique Checkout. '
  'Crée ton compte Namecheap (ou connecte-toi si tu en as déjà un). '
  'Renseigne tes informations, puis paie (carte / PayPal). '
  'Ouvre l''email de confirmation et valide ton adresse (obligatoire pour activer le domaine). '
  'Une fois payé, va dans Dashboard Domain List et vérifie que le domaine est Active. '
  'Quand c''est fait, envoie-moi simplement tes codes d''accès à ton compte Namecheap. '
  'Petites astuces. '
  'Si le nom exact est pris, teste les variantes (avec sans tiret, autre extension .fr .com). '
  'Garde Auto-renew activé et active la double authentification dans ton compte pour la sécurité.'
ON CONFLICT (slug) DO NOTHING;
