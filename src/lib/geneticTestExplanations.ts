// Genetic test explanations for different test types and results
import type { CommonGeneticTest, GeneticTestStatus } from '@/types';

interface TestExplanation {
  testName: string;
  description: string;
  clear: string;
  carrier: string;
  affected: string;
  breedingRecommendation?: string;
}

const testExplanations: Record<CommonGeneticTest, TestExplanation> = {
  DM: {
    testName: 'Degenerative Myelopathy',
    description: 'A progressive neurological disease affecting the spinal cord, leading to weakness and paralysis of the hind limbs.',
    clear: 'The dog has two normal copies of the gene and will not develop DM. They will not pass the mutation to offspring.',
    carrier: 'The dog has one normal copy and one mutated copy. They will not develop DM but can pass the mutation to offspring (50% chance per puppy).',
    affected: 'The dog has two mutated copies and is at risk of developing DM. They will pass the mutation to all offspring.',
    breedingRecommendation: 'Clear dogs can be bred to any dog. Carrier dogs should only be bred to Clear dogs. Affected dogs should not be bred.',
  },
  HUU: {
    testName: 'Hyperuricosuria',
    description: 'A condition that causes elevated levels of uric acid in the urine, leading to the formation of bladder and kidney stones.',
    clear: 'The dog has two normal copies of the gene and will not develop HUU. They will not pass the mutation to offspring.',
    carrier: 'The dog has one normal copy and one mutated copy. They will not develop HUU but can pass the mutation to offspring (50% chance per puppy).',
    affected: 'The dog has two mutated copies and is at risk of developing bladder/kidney stones. They will pass the mutation to all offspring.',
    breedingRecommendation: 'Clear dogs can be bred to any dog. Carrier dogs should only be bred to Clear dogs. Affected dogs should not be bred.',
  },
  CMR1: {
    testName: 'Canine Multifocal Retinopathy 1',
    description: 'An inherited eye disorder that causes retinal lesions, typically appearing between 11-20 weeks of age. Vision is usually not significantly affected.',
    clear: 'The dog has two normal copies of the gene and will not develop CMR1. They will not pass the mutation to offspring.',
    carrier: 'The dog has one normal copy and one mutated copy. They will not develop CMR1 but can pass the mutation to offspring (50% chance per puppy).',
    affected: 'The dog has two mutated copies and will develop retinal lesions. They will pass the mutation to all offspring.',
    breedingRecommendation: 'Clear dogs can be bred to any dog. Carrier dogs should only be bred to Clear dogs.',
  },
  EIC: {
    testName: 'Exercise Induced Collapse',
    description: 'A condition where dogs collapse after 5-15 minutes of strenuous exercise. Recovery typically occurs within 5-30 minutes.',
    clear: 'The dog has two normal copies of the gene and will not develop EIC. They will not pass the mutation to offspring.',
    carrier: 'The dog has one normal copy and one mutated copy. They will not develop EIC but can pass the mutation to offspring (50% chance per puppy).',
    affected: 'The dog has two mutated copies and is at risk of exercise-induced collapse. They will pass the mutation to all offspring.',
    breedingRecommendation: 'Clear dogs can be bred to any dog. Carrier dogs should only be bred to Clear dogs. Affected dogs should not be bred.',
  },
  'vWD1': {
    testName: 'Von Willebrand Disease Type 1',
    description: 'A bleeding disorder caused by a deficiency in von Willebrand factor, leading to prolonged bleeding times and increased risk of hemorrhage.',
    clear: 'The dog has two normal copies of the gene and will not develop vWD1. They will not pass the mutation to offspring.',
    carrier: 'The dog has one normal copy and one mutated copy. They may have mildly reduced clotting ability and can pass the mutation to offspring (50% chance per puppy).',
    affected: 'The dog has two mutated copies and will have significantly reduced clotting ability, increasing risk of excessive bleeding. They will pass the mutation to all offspring.',
    breedingRecommendation: 'Clear dogs can be bred to any dog. Carrier dogs should only be bred to Clear dogs. Affected dogs should not be bred.',
  },
  'PRA-prcd': {
    testName: 'Progressive Retinal Atrophy - prcd',
    description: 'A degenerative eye disease that causes progressive vision loss leading to blindness, typically beginning in middle age.',
    clear: 'The dog has two normal copies of the gene and will not develop PRA-prcd. They will not pass the mutation to offspring.',
    carrier: 'The dog has one normal copy and one mutated copy. They will not develop PRA-prcd but can pass the mutation to offspring (50% chance per puppy).',
    affected: 'The dog has two mutated copies and will develop progressive retinal atrophy leading to blindness. They will pass the mutation to all offspring.',
    breedingRecommendation: 'Clear dogs can be bred to any dog. Carrier dogs should only be bred to Clear dogs. Affected dogs should not be bred.',
  },
  CDDY: {
    testName: 'Chondrodystrophy',
    description: 'A condition causing shortened limbs and abnormal intervertebral disc development, increasing risk of disc disease.',
    clear: 'The dog has two normal copies of the gene and will have normal limb length. They will not pass the mutation to offspring.',
    carrier: 'The dog has one normal copy and one mutated copy. They will have shortened limbs and can pass the mutation to offspring (50% chance per puppy).',
    affected: 'The dog has two mutated copies and will have shortened limbs and increased risk of disc disease. They will pass the mutation to all offspring.',
    breedingRecommendation: 'Clear dogs can be bred to any dog. Carrier dogs should only be bred to Clear dogs.',
  },
  CDPA: {
    testName: 'Chondrodysplasia',
    description: 'A condition causing abnormal cartilage and bone development, leading to skeletal abnormalities.',
    clear: 'The dog has two normal copies of the gene and will have normal skeletal development. They will not pass the mutation to offspring.',
    carrier: 'The dog has one normal copy and one mutated copy. They may have mild skeletal abnormalities and can pass the mutation to offspring (50% chance per puppy).',
    affected: 'The dog has two mutated copies and will have significant skeletal abnormalities. They will pass the mutation to all offspring.',
    breedingRecommendation: 'Clear dogs can be bred to any dog. Carrier dogs should only be bred to Clear dogs. Affected dogs should not be bred.',
  },
  NCL: {
    testName: 'Neuronal Ceroid Lipofuscinosis',
    description: 'A fatal neurological disorder causing progressive brain and retinal degeneration, typically beginning in young adulthood.',
    clear: 'The dog has two normal copies of the gene and will not develop NCL. They will not pass the mutation to offspring.',
    carrier: 'The dog has one normal copy and one mutated copy. They will not develop NCL but can pass the mutation to offspring (50% chance per puppy).',
    affected: 'The dog has two mutated copies and will develop NCL, a fatal neurological disease. They will pass the mutation to all offspring.',
    breedingRecommendation: 'Clear dogs can be bred to any dog. Carrier dogs should only be bred to Clear dogs. Affected dogs should not be bred.',
  },
  JHC: {
    testName: 'Juvenile Hereditary Cataracts',
    description: 'An inherited eye condition causing cataracts to develop in young dogs, potentially leading to vision impairment.',
    clear: 'The dog has two normal copies of the gene and will not develop juvenile cataracts. They will not pass the mutation to offspring.',
    carrier: 'The dog has one normal copy and one mutated copy. They will not develop juvenile cataracts but can pass the mutation to offspring (50% chance per puppy).',
    affected: 'The dog has two mutated copies and will develop juvenile cataracts. They will pass the mutation to all offspring.',
    breedingRecommendation: 'Clear dogs can be bred to any dog. Carrier dogs should only be bred to Clear dogs. Affected dogs should not be bred.',
  },
  HSF4: {
    testName: 'Hereditary Cataracts',
    description: 'An inherited eye condition causing cataracts to develop, potentially leading to vision impairment or blindness.',
    clear: 'The dog has two normal copies of the gene and will not develop hereditary cataracts. They will not pass the mutation to offspring.',
    carrier: 'The dog has one normal copy and one mutated copy. They may develop cataracts and can pass the mutation to offspring (50% chance per puppy).',
    affected: 'The dog has two mutated copies and will develop hereditary cataracts. They will pass the mutation to all offspring.',
    breedingRecommendation: 'Clear dogs can be bred to any dog. Carrier dogs should only be bred to Clear dogs. Affected dogs should not be bred.',
  },
  MDR1: {
    testName: 'Multi-Drug Resistance 1',
    description: 'A mutation affecting drug metabolism, making dogs sensitive to certain medications including ivermectin, loperamide, and some chemotherapy drugs.',
    clear: 'The dog has two normal copies of the gene and has normal drug metabolism. They will not pass the mutation to offspring.',
    carrier: 'The dog has one normal copy and one mutated copy. They may have increased sensitivity to certain drugs and can pass the mutation to offspring (50% chance per puppy).',
    affected: 'The dog has two mutated copies and will have significantly increased sensitivity to certain medications. They will pass the mutation to all offspring.',
    breedingRecommendation: 'Clear dogs can be bred to any dog. Carrier dogs should only be bred to Clear dogs. Affected dogs require careful medication management.',
  },
  other: {
    testName: 'Other Genetic Test',
    description: 'A custom or less common genetic test.',
    clear: 'The dog tested clear for this condition and will not pass the mutation to offspring.',
    carrier: 'The dog is a carrier of this condition and may pass the mutation to offspring.',
    affected: 'The dog is affected by this condition and will pass the mutation to all offspring.',
  },
};

/**
 * Get explanation for a genetic test result
 */
export function getGeneticTestExplanation(
  testType: CommonGeneticTest,
  result: GeneticTestStatus
): string {
  const explanation = testExplanations[testType];
  if (!explanation) {
    return 'No explanation available for this test type.';
  }

  switch (result) {
    case 'clear':
      return explanation.clear;
    case 'carrier':
      return explanation.carrier;
    case 'affected':
      return explanation.affected;
    case 'pending':
      return 'Test results are pending. Please check back once results are available.';
    default:
      return 'No explanation available for this result.';
  }
}

/**
 * Get full test information including description and breeding recommendations
 */
export function getGeneticTestInfo(testType: CommonGeneticTest): TestExplanation {
  return testExplanations[testType] || testExplanations.other;
}

/**
 * Get breeding recommendation for a test result
 */
export function getBreedingRecommendation(testType: CommonGeneticTest): string | undefined {
  return testExplanations[testType]?.breedingRecommendation;
}

