# CASCADE Event Management - Database Schema

## Tables

### profiles
Extends Supabase auth.users. Stores role and display info.

| Column     | Type    | Notes                    |
|-----------|---------|--------------------------|
| id        | UUID    | PK, FK → auth.users      |
| email     | TEXT    |                          |
| full_name | TEXT    |                          |
| avatar_url| TEXT    | Optional                 |
| role      | TEXT    | client, admin, developer |
| created_at| TIMESTAMPTZ |                     |
| updated_at| TIMESTAMPTZ |                     |

### events
| Column           | Type    | Notes                          |
|-----------------|---------|--------------------------------|
| id              | UUID    | PK                             |
| created_by      | UUID    | FK → profiles                  |
| name            | TEXT    |                                |
| description     | TEXT    |                                |
| fee_amount      | INTEGER | Paise (0 = free)               |
| event_date      | TIMESTAMPTZ |                          |
| venue           | TEXT    |                                |
| max_registrations| INTEGER | Optional                    |
| is_published    | BOOLEAN | Default false                  |
| created_at      | TIMESTAMPTZ |                          |
| updated_at      | TIMESTAMPTZ |                          |

### event_images
| Column      | Type    | Notes              |
|------------|---------|--------------------|
| id         | UUID    | PK                 |
| event_id   | UUID    | FK → events        |
| storage_path| TEXT   | Supabase Storage   |
| sort_order | INTEGER | Carousel order     |
| created_at | TIMESTAMPTZ |                 |

### event_admins
Supporting admins per event.

| Column     | Type    | Notes                |
|-----------|---------|----------------------|
| id        | UUID    | PK                   |
| event_id  | UUID    | FK → events          |
| admin_id  | UUID    | FK → profiles        |
| role_name | TEXT    | Default "Supporting Admin" |
| created_at| TIMESTAMPTZ |                  |

### event_form_fields
Dynamic form fields per event. No shared forms.

| Column      | Type    | Notes                    |
|------------|---------|--------------------------|
| id         | UUID    | PK                       |
| event_id   | UUID    | FK → events              |
| field_key  | TEXT    | Unique per event         |
| field_label| TEXT    |                          |
| field_type | TEXT    | text, email, phone, number, textarea, select, checkbox, date |
| options    | JSONB   | For select: ["a","b"]    |
| is_required| BOOLEAN |                          |
| sort_order | INTEGER |                          |
| created_at | TIMESTAMPTZ |                    |

### registrations
| Column          | Type    | Notes                    |
|----------------|---------|--------------------------|
| id             | UUID    | PK                       |
| event_id       | UUID    | FK → events              |
| user_id        | UUID    | FK → profiles            |
| form_data      | JSONB   | Dynamic form values      |
| status         | TEXT    | pending, accepted, rejected |
| status_updated_by | UUID | FK → profiles            |
| status_updated_at | TIMESTAMPTZ |                  |
| status_notes   | TEXT    |                          |
| created_at     | TIMESTAMPTZ |                     |
| updated_at     | TIMESTAMPTZ |                     |
| UNIQUE(event_id, user_id) | | One registration per user per event |

### payments
| Column             | Type    | Notes                    |
|-------------------|---------|--------------------------|
| id                | UUID    | PK                       |
| registration_id   | UUID    | FK → registrations       |
| razorpay_order_id | TEXT    |                          |
| razorpay_payment_id| TEXT   |                          |
| razorpay_signature| TEXT    |                          |
| amount_paise      | INTEGER |                          |
| status            | TEXT    | pending, captured, failed, refunded |
| verified_at       | TIMESTAMPTZ |                    |
| created_at        | TIMESTAMPTZ |                     |

### activity_logs
| Column     | Type    | Notes    |
|-----------|---------|----------|
| id        | UUID    | PK       |
| actor_id  | UUID    | FK → profiles |
| action    | TEXT    |          |
| entity_type| TEXT   |          |
| entity_id | UUID    |          |
| metadata  | JSONB   |          |
| created_at| TIMESTAMPTZ |      |

## RLS Summary

- **Client:** Own registrations, payments; read published events
- **Admin:** Own events, event_admin events; manage registrations for those
- **Developer:** Full read/write on all tables
