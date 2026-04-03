import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { schoolName, schoolCode, schoolAddress, schoolPhone, fullName, email, password, directorPhone } =
      await request.json()

    // 1. Vérifier si le code école est déjà utilisé
    const { data: existingSchool } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('code', schoolCode.toUpperCase())
      .maybeSingle()

    if (existingSchool) {
      return NextResponse.json(
        { error: 'Ce code école est déjà utilisé. Veuillez en choisir un autre.' },
        { status: 409 }
      )
    }

    // 2. Créer le compte auth
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (signUpError || !authData.user) {
      return NextResponse.json(
        { error: signUpError?.message ?? 'Erreur lors de la création du compte.' },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // 3. Insérer l'école
    const { data: schoolData, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name: schoolName,
        code: schoolCode.toUpperCase(),
        address: schoolAddress || null,
        phone: schoolPhone || null,
        plan: 'free',
        billing_status: 'active',
      })
      .select('id')
      .single()

    if (schoolError || !schoolData) {
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteUserError) {
        console.error('Rollback failed: could not delete auth user', userId, deleteUserError)
      }
      return NextResponse.json(
        { error: "Erreur lors de l'inscription de l'école. Veuillez réessayer." },
        { status: 500 }
      )
    }

    // 4. Créer le profil directeur
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      school_id: schoolData.id,
      full_name: fullName,
      role: 'director',
      phone: directorPhone || null,
    })

    if (profileError) {
      const { error: deleteSchoolError } = await supabaseAdmin.from('schools').delete().eq('id', schoolData.id)
      if (deleteSchoolError) {
        console.error('Rollback failed: could not delete school', schoolData.id, deleteSchoolError)
      }
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteUserError) {
        console.error('Rollback failed: could not delete auth user', userId, deleteUserError)
      }
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil directeur.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error during registration:', err)
    return NextResponse.json({ error: 'Une erreur inattendue est survenue.' }, { status: 500 })
  }
}
