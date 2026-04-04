import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json()
    const { schoolName, schoolCode, schoolAddress, schoolPhone, fullName, email, password, directorPhone } = body

    // Validation des champs obligatoires
    if (!schoolName || typeof schoolName !== 'string' || schoolName.trim().length === 0) {
      return NextResponse.json({ error: "Le nom de l'école est obligatoire." }, { status: 400 })
    }
    if (!schoolCode || typeof schoolCode !== 'string' || !/^[A-Z0-9\-]{2,20}$/i.test(schoolCode.trim())) {
      return NextResponse.json({ error: 'Le code école doit faire entre 2 et 20 caractères (lettres, chiffres, tirets).' }, { status: 400 })
    }
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return NextResponse.json({ error: 'Le nom du directeur est obligatoire.' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 })
    }

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
        name: schoolName.trim(),
        code: schoolCode.toUpperCase().trim(),
        address: schoolAddress?.trim() || null,
        phone: schoolPhone?.trim() || null,
        plan: 'free',
        billing_status: 'active',
      })
      .select('id')
      .single()

    if (schoolError || !schoolData) {
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteAuthError) console.error('Rollback auth user failed:', deleteAuthError.message)
      return NextResponse.json(
        { error: "Erreur lors de l'inscription de l'école. Veuillez réessayer." },
        { status: 500 }
      )
    }

    // 4. Créer le profil directeur
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      school_id: schoolData.id,
      full_name: fullName.trim(),
      role: 'director',
      phone: directorPhone?.trim() || null,
    })

    if (profileError) {
      const { error: deleteSchoolError } = await supabaseAdmin.from('schools').delete().eq('id', schoolData.id)
      if (deleteSchoolError) console.error('Rollback school failed:', deleteSchoolError.message)
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteAuthError) console.error('Rollback auth user failed:', deleteAuthError.message)
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil directeur.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Une erreur inattendue est survenue.' }, { status: 500 })
  }
}
