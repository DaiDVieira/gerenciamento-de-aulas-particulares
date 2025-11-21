import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0'

Deno.serve(async (req) => {
  // Add CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if base admin already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const baseAdminExists = existingUser.users.some(u => u.email === 'admin@sistema.com')

    if (baseAdminExists) {
      return new Response(
        JSON.stringify({ message: 'Base admin already exists' }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Create the base admin user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@sistema.com',
      password: 'Admin@123',
      email_confirm: true,
      user_metadata: {
        nome: 'Administrador',
        sobrenome: 'Base'
      }
    })

    if (authError) {
      throw authError
    }

    // Update the administradores table with the correct user_id
    const { error: updateError } = await supabaseAdmin
      .from('administradores')
      .update({ user_id: authData.user.id })
      .eq('email', 'admin@sistema.com')

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        message: 'Base admin created successfully',
        user_id: authData.user.id 
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
