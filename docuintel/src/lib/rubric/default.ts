/**
 * Default contract review rubric
 */

import type { Rubric } from '@/lib/types';

export const defaultRubric: Rubric = {
  id: 'default-contract-review',
  name: 'Standard Contract Review',
  description: 'Comprehensive risk assessment for commercial contracts covering standard terms, liability, termination, and compliance.',
  categories: [
    {
      id: 'auto-renewal',
      name: 'Auto-Renewal & Term',
      description: 'Automatic renewal clauses, notice periods, and term length',
      riskFactors: [
        'Automatic renewal without notice requirement',
        'Long initial term (>3 years)',
        'Short notice period for non-renewal (<90 days)',
        'Evergreen clauses with no exit window',
      ],
      severityGuidance: {
        critical: 'Auto-renewal with no opt-out mechanism or notice period <30 days',
        high: 'Auto-renewal with notice period 30-60 days, or initial term >3 years',
        medium: 'Auto-renewal with 60-90 day notice, or term 2-3 years',
        low: 'Reasonable notice period (>90 days) or opt-in renewal',
      },
    },
    {
      id: 'liability',
      name: 'Liability & Indemnification',
      description: 'Liability caps, indemnification obligations, and limitation of liability',
      riskFactors: [
        'Unlimited liability',
        'Asymmetric indemnification (one-sided)',
        'Broad indemnification scope',
        'Low liability cap relative to contract value',
        'Carve-outs from liability limits',
      ],
      severityGuidance: {
        critical: 'Unlimited liability or one-sided indemnification with no cap',
        high: 'Liability cap below contract value or broad indemnification',
        medium: 'Reasonable cap with some asymmetry',
        low: 'Mutual liability limits at or above contract value',
      },
    },
    {
      id: 'termination',
      name: 'Termination Rights',
      description: 'Termination for convenience, breach, and post-termination obligations',
      riskFactors: [
        'No termination for convenience',
        'High termination fees',
        'Broad survival clauses',
        'Asymmetric termination rights',
        'Unclear breach cure periods',
      ],
      severityGuidance: {
        critical: 'No termination right or punitive termination fees (>50% contract value)',
        high: 'Termination fees 25-50% or asymmetric rights',
        medium: 'Reasonable termination fees (10-25%) or short cure period',
        low: 'Mutual termination for convenience with minimal fees',
      },
    },
    {
      id: 'payment',
      name: 'Payment Terms',
      description: 'Pricing, payment schedule, and fee adjustment mechanisms',
      riskFactors: [
        'Upfront payment required',
        'Price escalation clauses',
        'Unclear pricing structure',
        'Late payment penalties',
        'No refund provisions',
      ],
      severityGuidance: {
        critical: 'Full upfront payment or uncapped escalation',
        high: 'Significant upfront payment (>50%) or high escalation (>10% annually)',
        medium: 'Moderate upfront (25-50%) or escalation tied to index',
        low: 'Standard payment terms (net 30-60) with reasonable escalation',
      },
    },
    {
      id: 'ip-warranty',
      name: 'Intellectual Property & Warranties',
      description: 'IP ownership, licensing, and warranty provisions',
      riskFactors: [
        'Broad IP assignment',
        'Perpetual license grants',
        'Weak warranties or disclaimers',
        'No IP indemnification',
        'Unclear work product ownership',
      ],
      severityGuidance: {
        critical: 'Complete IP assignment or no IP indemnification',
        high: 'Broad IP license or weak warranties',
        medium: 'Limited IP grant with some warranty disclaimers',
        low: 'Clear IP ownership and standard warranties',
      },
    },
    {
      id: 'data-confidentiality',
      name: 'Data & Confidentiality',
      description: 'Data handling, privacy obligations, and confidentiality terms',
      riskFactors: [
        'No data security requirements',
        'Broad data usage rights',
        'Weak confidentiality obligations',
        'No breach notification requirement',
        'Data retention beyond term',
      ],
      severityGuidance: {
        critical: 'No data security or broad usage rights with no restrictions',
        high: 'Weak security standards or extended data retention',
        medium: 'Basic security with some retention issues',
        low: 'Strong security standards and clear data handling',
      },
    },
    {
      id: 'governing-law',
      name: 'Governing Law & Dispute Resolution',
      description: 'Jurisdiction, governing law, and dispute resolution mechanisms',
      riskFactors: [
        'Unfavorable jurisdiction',
        'Mandatory arbitration with restricted rights',
        'Fee-shifting provisions',
        'Waiver of jury trial',
        'Short statute of limitations',
      ],
      severityGuidance: {
        critical: 'Foreign jurisdiction with no appeal rights or mandatory arbitration in vendor location',
        high: 'Unfavorable jurisdiction or restricted dispute rights',
        medium: 'Neutral jurisdiction with standard arbitration',
        low: 'Mutual jurisdiction or favorable venue',
      },
    },
  ],
};
