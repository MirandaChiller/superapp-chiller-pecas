import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types para TypeScript
export type Database = {
  public: {
    Tables: {
      personas: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          nome: string
          idade_min: number
          idade_max: number
          profissao: string
          dados_demograficos: any
          narrativa_gerada: string | null
          imagem_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['personas']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['personas']['Insert']>
      }
      posicionamentos: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          canvas_data: any
          ikigai_data: any
          declaracao: string | null
        }
        Insert: Omit<Database['public']['Tables']['posicionamentos']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['posicionamentos']['Insert']>
      }
      content_pie: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          posts_por_dia: number
          temas: any[]
        }
        Insert: Omit<Database['public']['Tables']['content_pie']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['content_pie']['Insert']>
      }
      posts_planejados: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          data_publicacao: string | null
          tema: string
          objetivo: string
          formato: string
          sub_formato: string
          gancho: string
          conteudo: string
          cta: string
          status: string
          link_publicado: string | null
        }
        Insert: Omit<Database['public']['Tables']['posts_planejados']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['posts_planejados']['Insert']>
      }
      metricas_posts: {
        Row: {
          id: string
          created_at: string
          post_id: string
          data_coleta: string
          curtidas: number
          comentarios: number
          salvamentos: number
          compartilhamentos: number
          seguidores: number
          visitas_perfil: number
          score: number
          categoria: string
          investimento: number | null
          publico: string | null
          ganho_seguidores_impulsionamento: number | null
          custo_por_seguidor: number | null
        }
        Insert: Omit<Database['public']['Tables']['metricas_posts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['metricas_posts']['Insert']>
      }
      campanhas_trafego: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          nome: string
          data_analise: string
          checklist_itens: any[]
        }
        Insert: Omit<Database['public']['Tables']['campanhas_trafego']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['campanhas_trafego']['Insert']>
      }
    }
  }
}
