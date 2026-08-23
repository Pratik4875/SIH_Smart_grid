/**
 * RandomForest.ts
 * A client-side implementation of a Random Forest Classifier in TypeScript.
 * Used to predict weather conditions (Sunny, Cloudy, Rainy) from DHT11 sensors (Temp, Humidity).
 * Provides full transparency with training metrics, feature importances, and tree-traversal visualization.
 */

export interface RandomForestConfig {
  numTrees?: number;
  maxDepth?: number;
  minSamplesSplit?: number;
}

export type WeatherClass = 'Sunny' | 'Cloudy' | 'Rainy';

export interface SplitResult {
  feature: number; // 0 for Temperature, 1 for Humidity
  threshold: number;
  leftX: number[][];
  leftY: number[];
  rightX: number[][];
  rightY: number[];
  giniGain: number;
}

export class DecisionTreeNode {
  isLeaf: boolean = false;
  featureIndex: number = -1; // 0: Temp, 1: Humidity
  threshold: number = -1;
  left: DecisionTreeNode | null = null;
  right: DecisionTreeNode | null = null;
  value: number = -1; // Predict class index if leaf node (0: Sunny, 1: Cloudy, 2: Rainy)

  constructor(value?: number) {
    if (value !== undefined) {
      this.isLeaf = true;
      this.value = value;
    }
  }

  // Traverses the tree for a single input and records the path taken
  traverse(x: number[], path: string[] = []): { value: number; path: string[] } {
    if (this.isLeaf) {
      const className = ['Sunny', 'Cloudy', 'Rainy'][this.value];
      path.push(`Leaf Node: Output = ${className}`);
      return { value: this.value, path };
    }

    const featureName = this.featureIndex === 0 ? 'Temp' : 'Humidity';
    const val = x[this.featureIndex];
    if (val <= this.threshold) {
      path.push(`${featureName} (${val.toFixed(1)}°C/%) <= ${this.threshold.toFixed(1)}`);
      return this.left ? this.left.traverse(x, path) : { value: this.value, path };
    } else {
      path.push(`${featureName} (${val.toFixed(1)}°C/%) > ${this.threshold.toFixed(1)}`);
      return this.right ? this.right.traverse(x, path) : { value: this.value, path };
    }
  }
}

export class DecisionTree {
  root: DecisionTreeNode | null = null;
  maxDepth: number;
  minSamplesSplit: number;

  constructor(maxDepth: number = 5, minSamplesSplit: number = 2) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  fit(X: number[][], y: number[]): void {
    this.root = this.buildTree(X, y, 0);
  }

  predict(x: number[]): number {
    if (!this.root) return 0;
    return this.root.traverse(x).value;
  }

  predictDetailed(x: number[]): { value: number; path: string[] } {
    if (!this.root) return { value: 0, path: ['Empty tree'] };
    const path: string[] = [];
    return this.root.traverse(x, path);
  }

  private buildTree(X: number[][], y: number[], depth: number): DecisionTreeNode {
    const numSamples = X.length;
    const numClasses = new Set(y).size;

    // Base cases
    if (depth >= this.maxDepth || numSamples < this.minSamplesSplit || numClasses === 1) {
      return new DecisionTreeNode(this.majorityClass(y));
    }

    // Find best split
    const bestSplit = this.findBestSplit(X, y);
    if (bestSplit.giniGain <= 0 || bestSplit.leftX.length === 0 || bestSplit.rightX.length === 0) {
      return new DecisionTreeNode(this.majorityClass(y));
    }

    const node = new DecisionTreeNode();
    node.featureIndex = bestSplit.feature;
    node.threshold = bestSplit.threshold;
    node.left = this.buildTree(bestSplit.leftX, bestSplit.leftY, depth + 1);
    node.right = this.buildTree(bestSplit.rightX, bestSplit.rightY, depth + 1);
    return node;
  }

  private findBestSplit(X: number[][], y: number[]): SplitResult {
    let bestGain = -1;
    let bestSplit: SplitResult = {
      feature: -1,
      threshold: -1,
      leftX: [],
      leftY: [],
      rightX: [],
      rightY: [],
      giniGain: -1,
    };

    const currentGini = this.calculateGini(y);
    const numFeatures = X[0]?.length || 0;

    for (let feature = 0; feature < numFeatures; feature++) {
      // Collect unique feature values as split candidates
      const values = X.map((row) => row[feature]);
      const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        const leftX: number[][] = [];
        const leftY: number[] = [];
        const rightX: number[][] = [];
        const rightY: number[] = [];

        for (let j = 0; j < X.length; j++) {
          if (X[j][feature] <= threshold) {
            leftX.push(X[j]);
            leftY.push(y[j]);
          } else {
            rightX.push(X[j]);
            rightY.push(y[j]);
          }
        }

        const leftGini = this.calculateGini(leftY);
        const rightGini = this.calculateGini(rightY);
        const pLeft = leftY.length / y.length;
        const pRight = rightY.length / y.length;
        const childGini = pLeft * leftGini + pRight * rightGini;
        const giniGain = currentGini - childGini;

        if (giniGain > bestGain) {
          bestGain = giniGain;
          bestSplit = {
            feature,
            threshold,
            leftX,
            leftY,
            rightX,
            rightY,
            giniGain,
          };
        }
      }
    }

    return bestSplit;
  }

  private calculateGini(y: number[]): number {
    if (y.length === 0) return 0;
    const counts: { [key: number]: number } = {};
    for (const val of y) {
      counts[val] = (counts[val] || 0) + 1;
    }
    let sumSquares = 0;
    for (const c of Object.values(counts)) {
      const p = c / y.length;
      sumSquares += p * p;
    }
    return 1 - sumSquares;
  }

  private majorityClass(y: number[]): number {
    if (y.length === 0) return 0;
    const counts: { [key: number]: number } = {};
    let maxCount = -1;
    let majority = 0;
    for (const val of y) {
      counts[val] = (counts[val] || 0) + 1;
      if (counts[val] > maxCount) {
        maxCount = counts[val];
        majority = val;
      }
    }
    return majority;
  }
}

export class RandomForest {
  trees: DecisionTree[] = [];
  numTrees: number;
  maxDepth: number;
  minSamplesSplit: number;
  accuracy: number = 0;
  featureImportances: { temperature: number; humidity: number } = { temperature: 0.5, humidity: 0.5 };

  constructor(config?: RandomForestConfig) {
    this.numTrees = config?.numTrees || 15;
    this.maxDepth = config?.maxDepth || 4;
    this.minSamplesSplit = config?.minSamplesSplit || 2;
  }

  fit(X: number[][], y: number[]): void {
    this.trees = [];
    const numSamples = X.length;

    for (let i = 0; i < this.numTrees; i++) {
      const tree = new DecisionTree(this.maxDepth, this.minSamplesSplit);
      
      // Bootstrap sampling (with replacement)
      const bootstrapX: number[][] = [];
      const bootstrapY: number[] = [];
      for (let j = 0; j < numSamples; j++) {
        const randomIndex = Math.floor(Math.random() * numSamples);
        bootstrapX.push(X[randomIndex]);
        bootstrapY.push(y[randomIndex]);
      }

      tree.fit(bootstrapX, bootstrapY);
      this.trees.push(tree);
    }

    // Calculate Out-of-Bag (OOB) / Training Accuracy
    let correct = 0;
    for (let i = 0; i < numSamples; i++) {
      if (this.predict(X[i]) === y[i]) {
        correct++;
      }
    }
    this.accuracy = correct / numSamples;

    // Calculate Feature Importances based on tree structures
    let tempImportance = 0;
    let humidImportance = 0;
    
    for (const tree of this.trees) {
      const getTreeDepthNodeCount = (node: DecisionTreeNode | null) => {
        if (!node || node.isLeaf) return;
        if (node.featureIndex === 0) tempImportance++;
        else if (node.featureIndex === 1) humidImportance++;
        getTreeDepthNodeCount(node.left);
        getTreeDepthNodeCount(node.right);
      };
      getTreeDepthNodeCount(tree.root);
    }

    const totalSplits = tempImportance + humidImportance || 1;
    this.featureImportances = {
      temperature: tempImportance / totalSplits,
      humidity: humidImportance / totalSplits,
    };
  }

  predict(x: number[]): number {
    const votes = this.trees.map((tree) => tree.predict(x));
    const counts: { [key: number]: number } = {};
    let maxVotes = -1;
    let prediction = 0;

    for (const vote of votes) {
      counts[vote] = (counts[vote] || 0) + 1;
      if (counts[vote] > maxVotes) {
        maxVotes = counts[vote];
        prediction = vote;
      }
    }

    return prediction;
  }

  predictDetailed(x: number[]): {
    prediction: WeatherClass;
    confidence: number;
    votes: { Sunny: number; Cloudy: number; Rainy: number };
    paths: string[][];
  } {
    const votes = { Sunny: 0, Cloudy: 0, Rainy: 0 };
    const paths: string[][] = [];

    for (const tree of this.trees) {
      const detailed = tree.predictDetailed(x);
      const className = ['Sunny', 'Cloudy', 'Rainy'][detailed.value] as WeatherClass;
      votes[className]++;
      paths.push(detailed.path);
    }

    const totalVotes = this.numTrees;
    const maxVal = Math.max(votes.Sunny, votes.Cloudy, votes.Rainy);
    let prediction: WeatherClass = 'Sunny';
    if (maxVal === votes.Cloudy) prediction = 'Cloudy';
    if (maxVal === votes.Rainy) prediction = 'Rainy';

    return {
      prediction,
      confidence: maxVal / totalVotes,
      votes,
      paths: paths.slice(0, 5), // Keep first 5 trees for visualization
    };
  }
}

// Generate premium mock training dataset for Smart India Hackathon
// Based on typical sensor mappings
// Sunny: Temp 28C - 42C, Humidity 15% - 50%
// Cloudy: Temp 20C - 30C, Humidity 50% - 75%
// Rainy: Temp 15C - 26C, Humidity 75% - 98%
export function generateTrainingData(): { X: number[][]; y: number[] } {
  const X: number[][] = [];
  const y: number[] = [];

  // Generate 60 Sunny samples
  for (let i = 0; i < 60; i++) {
    const temp = 28 + Math.random() * 14;
    const humid = 15 + Math.random() * 35;
    X.push([temp, humid]);
    y.push(0); // Sunny
  }

  // Generate 60 Cloudy samples
  for (let i = 0; i < 60; i++) {
    const temp = 20 + Math.random() * 10;
    const humid = 50 + Math.random() * 25;
    X.push([temp, humid]);
    y.push(1); // Cloudy
  }

  // Generate 60 Rainy samples
  for (let i = 0; i < 60; i++) {
    const temp = 15 + Math.random() * 11;
    const humid = 75 + Math.random() * 23;
    X.push([temp, humid]);
    y.push(2); // Rainy
  }

  return { X, y };
}

// Static trained instance for quick bootstrap
export const defaultForest = new RandomForest({ numTrees: 10, maxDepth: 3 });
const { X, y } = generateTrainingData();
defaultForest.fit(X, y);
