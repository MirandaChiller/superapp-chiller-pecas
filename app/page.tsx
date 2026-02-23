import Link from "next/link";
import { 
  Users, 
  Target, 
  PieChart, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  ArrowRight 
} from "lucide-react";

const tools = [
  {
    name: "Gerador de Personas",
    description: "Crie personas detalhadas com IA para entender melhor seu público-alvo",
    href: "/personas",
    icon: Users,
    color: "from-[#085ba7] to-[#108bd1]",
    step: 1,
  },
  {
    name: "Posicionamento de Marca",
    description: "Defina Canvas, IKIGAI e Declaração de posicionamento estratégico",
    href: "/posicionamento",
    icon: Target,
    color: "from-[#108bd1] to-[#085ba7]",
    step: 2,
  },
  {
    name: "Temas & Intensidades",
    description: "Planeje distribuição de conteúdo e volume de posts mensais",
    href: "/content-pie",
    icon: PieChart,
    color: "from-[#ff901c] to-[#085ba7]",
    step: 3,
  },
  {
    name: "Planejamento de Feed",
    description: "Organize posts com objetivos, formatos e calendário editorial",
    href: "/feed",
    icon: Calendar,
    color: "from-[#085ba7] to-[#ff901c]",
    step: 4,
  },
  {
    name: "Métricas de Tráfego",
    description: "Checklist de otimização para campanhas pagas",
    href: "/metrics-matcher",
    icon: TrendingUp,
    color: "from-[#ff901c] to-[#108bd1]",
    step: 5,
  },
  {
    name: "Indicadores de Performance",
    description: "Acompanhe métricas e score de posts publicados",
    href: "/indicadores",
    icon: BarChart3,
    color: "from-[#108bd1] to-[#ff901c]",
    step: 6,
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900">
          Bem-vindo ao Superapp Chiller Peças
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Plataforma completa de inteligência de marketing integrada. 
          Gerencie personas, posicionamento, conteúdo e métricas em um único lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          
          return (
            <Link
              key={tool.name}
              href={tool.href}
              className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-slate-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10">
                <div className={`w-full h-full rounded-full bg-gradient-to-br ${tool.color}`} />
              </div>
              
              <div className="relative space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-sm font-bold">
                    {tool.step}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#ff901c] transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                
                <div className="flex items-center text-[#ff901c] font-semibold text-sm group-hover:translate-x-1 transition-transform">
                  Acessar ferramenta
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-[#085ba7] via-[#108bd1] to-[#ff901c] rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Fluxo de Trabalho Integrado</h2>
            <p className="text-blue-100">
              Persona → Posicionamento → Temas → Feed → Métricas
            </p>
          </div>
          <div className="hidden lg:flex items-center space-x-2">
            {tools.map((tool, index) => (
              <div key={tool.name} className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-bold">
                  <span className="text-sm font-bold">{index + 1}</span>
                </div>
                {index < tools.length - 1 && (
                  <ArrowRight className="w-5 h-5 mx-1 text-white/70" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
