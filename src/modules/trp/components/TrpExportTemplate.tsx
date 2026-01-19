import React from "react";
import { TrpViewModel } from "../utils/trpViewModel";
import { normalizeTrpValue } from "../utils/formatTrpValues";
import { organizeFieldsBySections } from "../utils/trpFieldSections";

// Import do logo CIAS (se existir em src/assets/cias-logo.png)
// Se o arquivo não existir, comentar a linha abaixo e usar placeholder
// import ciasLogo from '../../assets/cias-logo.png';

interface TrpExportTemplateProps {
  viewModel: TrpViewModel;
}

/**
 * Template de exportação do TRP
 * Renderiza HTML semântico otimizado para impressão/PDF (A4, print-friendly)
 * Layout institucional com logo CIAS e formatação de documento oficial
 * Não depende de CSS global do app - usa estilos inline
 */
export const TrpExportTemplate: React.FC<TrpExportTemplateProps> = ({
  viewModel,
}) => {
  const { campos } = viewModel;

  // ✅ Organizar campos dinamicamente por seções
  const sectionsWithFields = organizeFieldsBySections(
    campos as Record<string, unknown>
  );

  /**
   * ✅ Wrapper seguro:
   * - normalizeTrpValue aceita string | null, então NUNCA passamos undefined
   * - garante saída sempre string
   */
  const normalizeTrpSafe = (value: unknown, fieldName?: string): string => {
    if (value === null || value === undefined) return "Não informado";

    if (typeof value === "string") {
      const s = value.trim();
      if (!s) return "Não informado";
      // ✅ garante que não passa undefined pra normalizeTrpValue
      return normalizeTrpValue(s ?? null, fieldName);
    }

    // number/boolean/object -> string
    return normalizeTrpValue(String(value) ?? null, fieldName);
  };

  // Helper para normalizar campos vazios
  // ✅ GARANTIA: Sempre normaliza valores técnicos antes de exibir
  const normalizeField = (value: unknown, fieldName?: string): string => {
    return normalizeTrpSafe(value, fieldName);
  };

  // Helper para formatar observações (quebrar em linhas)
  // ✅ aceita undefined também (corrige TS do seu caso)
  const formatObservacoes = (obs?: string | null): string[] => {
    if (!obs || obs.trim() === "") {
      return ["Não informado"];
    }
    // Quebrar por ponto, ponto e vírgula ou quebra de linha
    return obs
      .split(/[.;]\s*|\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  // Estilos do container A4 (folha)
  const containerStyles: React.CSSProperties = {
    width: "210mm",
    minHeight: "297mm",
    margin: "0 auto",
    padding: "20mm",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e0e0e0",
    borderRadius: "2px",
  };

  // Estilos do documento
  const documentStyles: React.CSSProperties = {
    fontFamily: '"Times New Roman", "Liberation Serif", serif',
    fontSize: "12pt",
    lineHeight: "1.6",
    color: "#000000",
  };

  // Cabeçalho com logo e título
  const headerContainerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "15mm",
    paddingBottom: "8mm",
    borderBottom: "2px solid #1a1a1a",
  };

  const logoContainerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
  };

  const logoStyles: React.CSSProperties = {
    height: "60px", // Logo maior no preview
    width: "auto",
    marginRight: "8mm",
  };

  const headerTextStyles: React.CSSProperties = {
    flex: 1,
    textAlign: "right",
  };

  const orgNameStyles: React.CSSProperties = {
    fontSize: "14pt",
    fontWeight: "bold",
    marginBottom: "2mm",
    color: "#1a1a1a",
  };

  const docTypeStyles: React.CSSProperties = {
    fontSize: "16pt",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#1a1a1a",
  };

  // Resumo do documento (grid 2 colunas)
  const resumoContainerStyles: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4mm",
    marginBottom: "12mm",
    padding: "6mm",
    backgroundColor: "#f8f9fa",
    border: "1px solid #dee2e6",
    borderRadius: "2px",
  };

  const resumoItemStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
  };

  const resumoLabelStyles: React.CSSProperties = {
    fontSize: "10pt",
    fontWeight: "bold",
    color: "#495057",
    marginBottom: "1mm",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const resumoValueStyles: React.CSSProperties = {
    fontSize: "12pt",
    color: "#1a1a1a",
    fontWeight: "600",
  };

  // Títulos de seção
  const h2Styles: React.CSSProperties = {
    fontSize: "13pt",
    fontWeight: "bold",
    marginTop: "10mm",
    marginBottom: "5mm",
    paddingBottom: "2mm",
    borderBottom: "1.5px solid #1a1a1a",
    color: "#1a1a1a",
  };

  // Tabelas
  const tableStyles: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "8mm",
    fontSize: "11pt",
    border: "1px solid #dee2e6",
  };

  const tableHeaderStyles: React.CSSProperties = {
    backgroundColor: "#343a40",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "11pt",
    padding: "4mm",
    textAlign: "left",
    borderBottom: "2px solid #1a1a1a",
  };

  const tableRowStyles: React.CSSProperties = {
    borderBottom: "1px solid #e0e0e0",
  };

  const tableRowEvenStyles: React.CSSProperties = {
    ...tableRowStyles,
    backgroundColor: "#f8f9fa",
  };

  const tableCellLabelStyles: React.CSSProperties = {
    width: "35%",
    padding: "4mm",
    fontWeight: "bold",
    verticalAlign: "top",
    borderRight: "1px solid #e0e0e0",
    backgroundColor: "#f8f9fa",
  };

  const tableCellValueStyles: React.CSSProperties = {
    width: "65%",
    padding: "4mm",
    verticalAlign: "top",
    wordWrap: "break-word",
    whiteSpace: "normal",
  };

  const objetoStyles: React.CSSProperties = {
    ...tableCellValueStyles,
    wordWrap: "break-word",
    whiteSpace: "normal",
    lineHeight: "1.6",
  };

  // Lista de observações
  const listStyles: React.CSSProperties = {
    margin: "3mm 0",
    paddingLeft: "8mm",
    lineHeight: "1.8",
  };

  const listItemStyles: React.CSSProperties = {
    marginBottom: "3mm",
    lineHeight: "1.6",
  };

  // Atesto
  const atestoStyles: React.CSSProperties = {
    marginTop: "8mm",
    padding: "6mm",
    borderLeft: "4px solid #1a1a1a",
    paddingLeft: "8mm",
    fontStyle: "italic",
    lineHeight: "1.8",
    backgroundColor: "#f8f9fa",
    borderRadius: "2px",
  };

  // Assinaturas
  const assinaturasContainerStyles: React.CSSProperties = {
    marginTop: "20mm",
    display: "flex",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: "15mm",
  };

  const assinaturaBoxStyles: React.CSSProperties = {
    width: "80mm",
    textAlign: "center",
    marginTop: "25mm",
  };

  const assinaturaLabelStyles: React.CSSProperties = {
    margin: "2mm 0",
    fontSize: "10pt",
    fontWeight: "bold",
    color: "#495057",
  };

  const assinaturaLineStyles: React.CSSProperties = {
    borderTop: "1.5px solid #1a1a1a",
    marginTop: "35mm",
    paddingTop: "3mm",
    fontSize: "11pt",
    fontWeight: "500",
  };

  const dataAssinaturaStyles: React.CSSProperties = {
    marginTop: "10mm",
    textAlign: "center",
    fontSize: "11pt",
    fontWeight: "500",
  };

  return (
    <div style={containerStyles}>
      <article style={documentStyles}>
        {/* Cabeçalho com logo CIAS */}
        <header style={headerContainerStyles}>
          <div style={logoContainerStyles}>
            {/* Logo CIAS - descomentar quando o arquivo src/assets/cias-logo.png existir */}
            {/* {ciasLogo ? (
              <img
                src={ciasLogo}
                alt="CIAS Logo"
                style={logoStyles}
                onError={(e) => {
                  // Se falhar ao carregar, esconder a imagem
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : ( */}
            <div
              style={{
                ...logoStyles,
                backgroundColor: "#1a1a1a",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10pt",
                fontWeight: "bold",
                padding: "0 8mm",
                borderRadius: "2px",
              }}
            >
              CIAS
            </div>
            {/* )} */}
          </div>
          <div style={headerTextStyles}>
            <div style={orgNameStyles}>
              CENTRO INTEGRADO DE ANÁLISE E SUPORTE
            </div>
            <div style={docTypeStyles}>TERMO DE RECEBIMENTO PROVISÓRIO</div>
          </div>
        </header>

        {/* Resumo do Documento */}
        <div style={resumoContainerStyles}>
          <div style={resumoItemStyles}>
            <div style={resumoLabelStyles}>Contrato</div>
            <div style={resumoValueStyles}>
              {normalizeField(campos.numero_contrato, "numero_contrato")}
            </div>
          </div>
          <div style={resumoItemStyles}>
            <div style={resumoLabelStyles}>Nota Fiscal</div>
            <div style={resumoValueStyles}>
              {normalizeField(campos.numero_nf, "numero_nf")}
            </div>
          </div>
          <div style={resumoItemStyles}>
            <div style={resumoLabelStyles}>Valor</div>
            <div style={resumoValueStyles}>
              {normalizeField(
                (campos as any).valor_efetivo_formatado ??
                  (campos as any).valor_efetivo_numero ??
                  (campos as any).valor_efetivo ??
                  null,
                "valor_efetivo_formatado"
              )}
            </div>
          </div>
          <div style={resumoItemStyles}>
            <div style={resumoLabelStyles}>Data de Entrega</div>
            <div style={resumoValueStyles}>
              {normalizeField((campos as any).data_entrega ?? null, "data_entrega")}
            </div>
          </div>
        </div>

        {/* ✅ RENDERIZAÇÃO DINÂMICA: Todas as seções são geradas automaticamente */}
        {sectionsWithFields.map(({ section, fields }, sectionIndex) => {
          // Seção especial: Observações (renderizar como lista)
          if (section.title === "OBSERVAÇÕES" && fields.length > 0) {
            const observacoesField = fields.find(
              (f) => f.fieldName === "observacoes"
            );

            const observacoesValue = observacoesField?.value as
              | string
              | null
              | undefined;

            return (
              <section key={section.title}>
                <h2 style={h2Styles}>
                  {sectionIndex + 1}. {section.title}
                </h2>
                <ul style={listStyles}>
                  {formatObservacoes(observacoesValue).map((obs, index) => (
                    <li key={index} style={listItemStyles}>
                      {obs}
                    </li>
                  ))}
                </ul>
              </section>
            );
          }

          // Seção especial: Assinaturas (renderizar com layout especial)
          if (section.title === "ASSINATURAS" && fields.length > 0) {
            return (
              <section key={section.title}>
                <h2 style={h2Styles}>
                  {sectionIndex + 1}. {section.title}
                </h2>
                <div style={assinaturasContainerStyles}>
                  {fields
                    .filter((f) => f.fieldName !== "data_assinatura")
                    .map((field) => (
                      <div key={field.fieldName} style={assinaturaBoxStyles}>
                        <p style={assinaturaLabelStyles}>{field.label}</p>
                        <div style={assinaturaLineStyles}>
                          {field.value
                            ? normalizeField(field.value, field.fieldName)
                            : "_________________"}
                        </div>
                      </div>
                    ))}
                </div>
                {(() => {
                  const dataField = fields.find(
                    (f) => f.fieldName === "data_assinatura"
                  );
                  return (
                    <div style={dataAssinaturaStyles}>
                      Data de Assinatura:{" "}
                      {dataField?.value
                        ? normalizeField(dataField.value, "data_assinatura")
                        : viewModel.createdAt
                        ? new Date(viewModel.createdAt).toLocaleDateString("pt-BR")
                        : "_________________"}
                    </div>
                  );
                })()}
              </section>
            );
          }

          // Seção especial: Atesto (sempre após Condições de Recebimento)
          if (
            section.title === "CONDIÇÕES DE RECEBIMENTO" &&
            sectionIndex ===
              sectionsWithFields.findIndex(
                (s) => s.section.title === "CONDIÇÕES DE RECEBIMENTO"
              )
          ) {
            const observacoesIndex = sectionsWithFields.findIndex(
              (s) => s.section.title === "OBSERVAÇÕES"
            );
            const atestoIndex =
              observacoesIndex >= 0 ? observacoesIndex + 1 : sectionIndex + 1;

            return (
              <React.Fragment key={section.title}>
                <section>
                  <h2 style={h2Styles}>
                    {sectionIndex + 1}. {section.title}
                  </h2>
                  <table style={tableStyles}>
                    <thead>
                      <tr>
                        <th style={tableHeaderStyles}>Campo</th>
                        <th style={tableHeaderStyles}>Informação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, fieldIndex) => {
                        const isEven = fieldIndex % 2 === 1;
                        const rowStyle = isEven
                          ? tableRowEvenStyles
                          : tableRowStyles;
                        const isObjeto = field.fieldName === "objeto_contrato";
                        const cellValueStyle = isObjeto
                          ? objetoStyles
                          : tableCellValueStyles;

                        return (
                          <tr key={field.fieldName} style={rowStyle}>
                            <td style={tableCellLabelStyles}>{field.label}</td>
                            <td style={cellValueStyle}>
                              {normalizeTrpSafe(field.value, field.fieldName)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>

                {/* Atesto sempre após Condições de Recebimento */}
                <section>
                  <h2 style={h2Styles}>{atestoIndex + 1}. ATESTO</h2>
                  <blockquote style={atestoStyles}>
                    Atesto o recebimento provisório do objeto, exclusivamente para
                    fins de verificação, nos termos do art. 140 da Lei nº
                    14.133/2021, não implicando este ato em aceitação definitiva nem
                    afastando as responsabilidades legais e contratuais do
                    contratado.
                  </blockquote>
                </section>
              </React.Fragment>
            );
          }

          // Seções normais (tabelas)
          if (fields.length > 0) {
            return (
              <section key={section.title}>
                <h2 style={h2Styles}>
                  {sectionIndex + 1}. {section.title}
                </h2>
                <table style={tableStyles}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyles}>Campo</th>
                      <th style={tableHeaderStyles}>Informação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, fieldIndex) => {
                      const isEven = fieldIndex % 2 === 1;
                      const rowStyle = isEven
                        ? tableRowEvenStyles
                        : tableRowStyles;
                      const isObjeto = field.fieldName === "objeto_contrato";
                      const cellValueStyle = isObjeto
                        ? objetoStyles
                        : tableCellValueStyles;

                      return (
                        <tr key={field.fieldName} style={rowStyle}>
                          <td style={tableCellLabelStyles}>{field.label}</td>
                          <td style={cellValueStyle}>
                            {normalizeTrpSafe(field.value, field.fieldName)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            );
          }

          return null;
        })}
      </article>
    </div>
  );
};
