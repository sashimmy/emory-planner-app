import React, { useState, useCallback, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Import Crimson Pro font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Emory Course Atlas Data (based on 2024 catalog structure)
// In production, this would fetch from: https://github.com/emorynlp/EmoryCourseAtlas/tree/main/dat
const COURSE_ATLAS = {
  // QTM Courses
  'QTM 110': { name: 'Introduction to Scientific Methods', credits: 3, department: 'QTM', description: 'Introduction to scientific reasoning and research methods.', prereqs: [], gers: ['QR'] },
  'QTM 150': { name: 'Introduction to Statistical Computing I', credits: 2, department: 'QTM', description: 'Introduction to statistical computing using R.', prereqs: ['QTM 110'], gers: ['QR'] },
  'QTM 151': { name: 'Introduction to Statistical Computing II', credits: 2, department: 'QTM', description: 'Continuation of statistical computing.', prereqs: ['QTM 150'], gers: ['QR'] },
  'QTM 210': { name: 'Probability and Statistics', credits: 4, department: 'QTM', description: 'Probability theory and statistical inference.', prereqs: ['MATH 211 or MATH 210'], gers: ['QR'] },
  'QTM 220': { name: 'Regression Analysis', credits: 4, department: 'QTM', description: 'Linear regression and related methods.', prereqs: ['QTM 210'], gers: [] },
  'QTM 302W': { name: 'Research Design and Writing', credits: 4, department: 'QTM', description: 'Research methodology with writing focus.', prereqs: ['QTM 220'], gers: ['W'] },
  'QTM 350': { name: 'Data Science Computing', credits: 4, department: 'QTM', description: 'Advanced computing for data science.', prereqs: ['QTM 151'], gers: [] },
  'QTM 385': { name: 'Applied Machine Learning', credits: 4, department: 'QTM', description: 'Practical machine learning techniques.', prereqs: ['QTM 220'], gers: [] },
  'QTM 447': { name: 'Causal Inference', credits: 4, department: 'QTM', description: 'Methods for causal analysis.', prereqs: ['QTM 220'], gers: [] },
  
  // MATH Courses
  'MATH 111': { name: 'Calculus I', credits: 3, department: 'MATH', description: 'Limits, derivatives, and introduction to integrals.', prereqs: [], gers: ['QR'] },
  'MATH 112': { name: 'Calculus II', credits: 3, department: 'MATH', description: 'Integration techniques and series.', prereqs: ['MATH 111'], gers: ['QR'] },
  'MATH 210': { name: 'Advanced Calculus for Data Science', credits: 4, department: 'MATH', description: 'Multivariable calculus for data applications.', prereqs: ['MATH 112'], gers: ['QR'] },
  'MATH 211': { name: 'Multivariable Calculus', credits: 4, department: 'MATH', description: 'Calculus of several variables.', prereqs: ['MATH 112'], gers: ['QR'] },
  'MATH 221': { name: 'Linear Algebra', credits: 4, department: 'MATH', description: 'Vector spaces, matrices, and linear transformations.', prereqs: ['MATH 112'], gers: ['QR'] },
  'MATH 250': { name: 'Foundations of Mathematics', credits: 4, department: 'MATH', description: 'Logic, sets, and proof techniques.', prereqs: ['MATH 112'], gers: [] },
  'MATH 315': { name: 'Numerical Analysis', credits: 4, department: 'MATH', description: 'Computational methods for mathematical problems.', prereqs: ['MATH 221'], gers: [] },
  'MATH 321': { name: 'Abstract Algebra', credits: 4, department: 'MATH', description: 'Groups, rings, and fields.', prereqs: ['MATH 221'], gers: [] },
  'MATH 346': { name: 'Topology', credits: 4, department: 'MATH', description: 'Point-set topology fundamentals.', prereqs: ['MATH 250'], gers: [] },
  'MATH 351': { name: 'Partial Differential Equations', credits: 4, department: 'MATH', description: 'Methods for solving PDEs.', prereqs: ['MATH 211'], gers: [] },
  'MATH 361': { name: 'Probability Theory', credits: 4, department: 'MATH', description: 'Mathematical foundations of probability.', prereqs: ['MATH 211'], gers: [] },
  'MATH 362': { name: 'Mathematical Statistics', credits: 4, department: 'MATH', description: 'Statistical theory and methods.', prereqs: ['MATH 361'], gers: [] },
  'MATH 411': { name: 'Real Analysis I', credits: 4, department: 'MATH', description: 'Rigorous study of real numbers and functions.', prereqs: ['MATH 250'], gers: [] },
  'MATH 412': { name: 'Real Analysis II', credits: 4, department: 'MATH', description: 'Continuation of real analysis.', prereqs: ['MATH 411'], gers: [] },
  
  // ECON Courses
  'ECON 101': { name: 'Principles of Microeconomics', credits: 3, department: 'ECON', description: 'Introduction to microeconomic theory.', prereqs: [], gers: ['SS'] },
  'ECON 112': { name: 'Principles of Macroeconomics', credits: 3, department: 'ECON', description: 'Introduction to macroeconomic theory.', prereqs: [], gers: ['SS'] },
  'ECON 201': { name: 'Intermediate Microeconomics', credits: 3, department: 'ECON', description: 'Advanced microeconomic analysis.', prereqs: ['ECON 101', 'MATH 111'], gers: [] },
  'ECON 212': { name: 'Intermediate Macroeconomics', credits: 3, department: 'ECON', description: 'Advanced macroeconomic analysis.', prereqs: ['ECON 112', 'MATH 111'], gers: [] },
  'ECON 220': { name: 'Econometrics', credits: 3, department: 'ECON', description: 'Statistical methods for economic analysis.', prereqs: ['ECON 201', 'QTM 210'], gers: [] },
  'ECON 301': { name: 'Game Theory', credits: 3, department: 'ECON', description: 'Strategic decision making.', prereqs: ['ECON 201'], gers: [] },
  'ECON 320': { name: 'Labor Economics', credits: 3, department: 'ECON', description: 'Economics of labor markets.', prereqs: ['ECON 201'], gers: [] },
  'ECON 330': { name: 'Public Economics', credits: 3, department: 'ECON', description: 'Government and the economy.', prereqs: ['ECON 201'], gers: [] },
  'ECON 340': { name: 'International Trade', credits: 3, department: 'ECON', description: 'Theory and policy of international trade.', prereqs: ['ECON 201'], gers: [] },
  'ECON 350': { name: 'Money and Banking', credits: 3, department: 'ECON', description: 'Financial institutions and monetary policy.', prereqs: ['ECON 212'], gers: [] },
  'ECON 421': { name: 'Advanced Econometrics', credits: 3, department: 'ECON', description: 'Advanced statistical methods.', prereqs: ['ECON 220'], gers: [] },
  
  // Business Courses
  // Business/Accounting Courses
  'ACT 200': { name: 'Financial Accounting', credits: 3, department: 'ACT', description: 'Introduction to financial accounting.', prereqs: [], gers: [] },
  'ACT 300': { name: 'Intermediate Accounting', credits: 3, department: 'ACT', description: 'Intermediate financial accounting concepts.', prereqs: ['ACT 200'], gers: [] },
  'ACT 310': { name: 'Cost Accounting', credits: 3, department: 'ACT', description: 'Managerial and cost accounting.', prereqs: ['ACT 200'], gers: [] },
  'ACT 410': { name: 'Managerial Accounting', credits: 3, department: 'ACT', description: 'Accounting for management decision-making.', prereqs: ['ACT 200'], gers: [] },
  'BUS 290': { name: 'Tech Toolbox A: Excel', credits: 1, department: 'BUS', description: 'Advanced Excel skills for business.', prereqs: [], gers: [] },
  'BUS 300': { name: 'BBA Boardroom', credits: 2, department: 'BUS', description: 'Professional development and business fundamentals.', prereqs: [], gers: [] },
  'BUS 350': { name: 'Data and Decision Analytics', credits: 3, department: 'BUS', description: 'Data-driven decision making.', prereqs: ['ACT 200'], gers: [] },
  'BUS 365': { name: 'Business Analytics', credits: 3, department: 'BUS', description: 'Analytics methods for business decisions.', prereqs: [], gers: [] },
  'BUS 380': { name: 'Professional Development', credits: 2, department: 'BUS', description: 'Career and professional skills development.', prereqs: [], gers: [] },
  'BUS 381': { name: 'Personal Development', credits: 0.5, department: 'BUS', description: 'Personal growth and self-awareness.', prereqs: [], gers: [] },
  'BUS 383': { name: 'Team Dynamics and Leadership', credits: 0.5, department: 'BUS', description: 'Team collaboration and leadership skills.', prereqs: [], gers: [] },
  'BUS 390': { name: 'Tech Tools', credits: 2, department: 'BUS', description: 'Technology tools for business.', prereqs: [], gers: [] },
  'BUS 400': { name: 'Business Strategy', credits: 3, department: 'BUS', description: 'Strategic management and planning.', prereqs: [], gers: [] },
  'BUS 480': { name: 'Senior Seminars', credits: 2, department: 'BUS', description: 'Capstone seminars for BBA students.', prereqs: [], gers: [] },
  'FIN 300': { name: 'Financial Management', credits: 3, department: 'FIN', description: 'Corporate finance fundamentals.', prereqs: ['ACT 200', 'ECON 101'], gers: [] },
  'FIN 320': { name: 'Corporate Finance', credits: 3, department: 'FIN', description: 'Advanced corporate finance.', prereqs: ['ACT 200'], gers: [] },
  'FIN 323': { name: 'Investments', credits: 3, department: 'FIN', description: 'Investment analysis and portfolio management.', prereqs: ['FIN 320'], gers: [] },
  'FIN 370': { name: 'Investments', credits: 3, department: 'FIN', description: 'Security analysis and portfolio management.', prereqs: ['FIN 300'], gers: [] },
  'FIN 450': { name: 'Derivatives', credits: 3, department: 'FIN', description: 'Options, futures, and other derivatives.', prereqs: ['FIN 370'], gers: [] },
  'ISOM 351': { name: 'Information Systems', credits: 3, department: 'ISOM', description: 'Management information systems.', prereqs: [], gers: [] },
  'ISOM 352': { name: 'Business Process Management', credits: 3, department: 'ISOM', description: 'Process analysis and improvement.', prereqs: ['ISOM 351'], gers: [] },
  'MKT 340': { name: 'Marketing Management', credits: 3, department: 'MKT', description: 'Marketing strategy and analysis.', prereqs: [], gers: [] },
  'MKT 345': { name: 'Consumer Insights', credits: 3, department: 'MKT', description: 'Understanding consumer behavior and insights.', prereqs: ['MKT 340'], gers: [] },
  'MKT 360': { name: 'Consumer Behavior', credits: 3, department: 'MKT', description: 'Psychology of consumer decision-making.', prereqs: ['MKT 340'], gers: [] },
  'OAM 330': { name: 'Operations Management', credits: 3, department: 'OAM', description: 'Managing business operations.', prereqs: [], gers: [] },
  'OAM 331': { name: 'Operations Management', credits: 3, department: 'OAM', description: 'Managing business operations (alternate section).', prereqs: [], gers: [] },
  'MGT 300': { name: 'Organizational Behavior', credits: 3, department: 'MGT', description: 'Behavior in organizations.', prereqs: [], gers: [] },
  'MGT 410': { name: 'Leadership', credits: 3, department: 'MGT', description: 'Leadership theory and practice.', prereqs: ['MGT 300'], gers: [] },
  'OMS 350': { name: 'Operations Management', credits: 3, department: 'OMS', description: 'Managing business operations.', prereqs: ['BUS 350'], gers: [] },
  
  // CS Courses
  'CS 170': { name: 'Introduction to Computer Science I', credits: 4, department: 'CS', description: 'Programming fundamentals in Python.', prereqs: [], gers: ['QR'] },
  'CS 171': { name: 'Introduction to Computer Science II', credits: 4, department: 'CS', description: 'Object-oriented programming in Java.', prereqs: ['CS 170'], gers: [] },
  'CS 224': { name: 'Discrete Structures', credits: 3, department: 'CS', description: 'Mathematical foundations of CS.', prereqs: ['CS 170'], gers: ['QR'] },
  'CS 253': { name: 'Data Structures and Algorithms', credits: 3, department: 'CS', description: 'Fundamental data structures.', prereqs: ['CS 171'], gers: [] },
  'CS 255': { name: 'Computer Architecture', credits: 3, department: 'CS', description: 'Hardware organization and design.', prereqs: ['CS 171'], gers: [] },
  'CS 323': { name: 'Theory of Computation', credits: 3, department: 'CS', description: 'Formal languages and automata.', prereqs: ['CS 224'], gers: [] },
  'CS 325': { name: 'Artificial Intelligence', credits: 3, department: 'CS', description: 'Introduction to AI concepts.', prereqs: ['CS 253'], gers: [] },
  'CS 329': { name: 'Computational Linguistics', credits: 3, department: 'CS', description: 'Natural language processing.', prereqs: ['CS 253'], gers: [] },
  'CS 334': { name: 'Machine Learning', credits: 3, department: 'CS', description: 'Statistical machine learning.', prereqs: ['CS 253', 'MATH 221'], gers: [] },
  'CS 350': { name: 'Operating Systems', credits: 3, department: 'CS', description: 'OS design and implementation.', prereqs: ['CS 253', 'CS 255'], gers: [] },
  'CS 370': { name: 'Computer Networks', credits: 3, department: 'CS', description: 'Network protocols and architecttic.', prereqs: ['CS 253'], gers: [] },
  'CS 377': { name: 'Database Systems', credits: 3, department: 'CS', description: 'Database design and SQL.', prereqs: ['CS 253'], gers: [] },
  'CS 485': { name: 'Deep Learning', credits: 3, department: 'CS', description: 'Neural networks and deep learning.', prereqs: ['CS 334'], gers: [] },
  
  // PSYC Courses
  'PSYC 110': { name: 'Introduction to Psychobiology & Cognition', credits: 3, department: 'PSYC', description: 'Biological bases of behavior.', prereqs: [], gers: ['NS'] },
  'PSYC 111': { name: 'Introduction to Social & Personality Psychology', credits: 3, department: 'PSYC', description: 'Social behavior and personality.', prereqs: [], gers: ['SS'] },
  'PSYC 200': { name: 'Research Methods in Psychology', credits: 4, department: 'PSYC', description: 'Research design and methodology.', prereqs: ['PSYC 110 or PSYC 111'], gers: [] },
  'PSYC 210': { name: 'Statistics for Psychology', credits: 4, department: 'PSYC', description: 'Statistical methods for psychology.', prereqs: ['PSYC 200'], gers: ['QR'] },
  'PSYC 250': { name: 'Cognitive Psychology', credits: 3, department: 'PSYC', description: 'Mental processes and cognition.', prereqs: ['PSYC 110'], gers: [] },
  'PSYC 260': { name: 'Developmental Psychology', credits: 3, department: 'PSYC', description: 'Human development across lifespan.', prereqs: ['PSYC 111'], gers: [] },
  'PSYC 270': { name: 'Abnormal Psychology', credits: 3, department: 'PSYC', description: 'Psychological disorders.', prereqs: ['PSYC 111'], gers: [] },
  'PSYC 310': { name: 'Behavioral Neuroscience', credits: 3, department: 'PSYC', description: 'Brain and behavior relationships.', prereqs: ['PSYC 110'], gers: [] },
  'PSYC 320': { name: 'Social Psychology', credits: 3, department: 'PSYC', description: 'Social influence and interaction.', prereqs: ['PSYC 111'], gers: [] },
  
  // BIOL Courses
  'BIOL 141': { name: 'Foundations of Modern Biology I', credits: 4, department: 'BIOL', description: 'Introduction to biology.', prereqs: [], gers: ['NS'] },
  'BIOL 142': { name: 'Foundations of Modern Biology II', credits: 4, department: 'BIOL', description: 'Continuation of biology.', prereqs: ['BIOL 141'], gers: ['NS'] },
  'BIOL 200': { name: 'Genetics', credits: 4, department: 'BIOL', description: 'Principles of genetics.', prereqs: ['BIOL 142'], gers: [] },
  'BIOL 210': { name: 'Ecology', credits: 4, department: 'BIOL', description: 'Ecological principles.', prereqs: ['BIOL 142'], gers: [] },
  'BIOL 240': { name: 'Cell Biology', credits: 4, department: 'BIOL', description: 'Cell structure and function.', prereqs: ['BIOL 142', 'CHEM 150'], gers: [] },
  'BIOL 250': { name: 'Microbiology', credits: 4, department: 'BIOL', description: 'Study of microorganisms.', prereqs: ['BIOL 142'], gers: [] },
  'BIOL 301': { name: 'Biochemistry', credits: 4, department: 'BIOL', description: 'Chemistry of biological systems.', prereqs: ['BIOL 240', 'CHEM 221'], gers: [] },
  'BIOL 320': { name: 'Molecular Biology', credits: 4, department: 'BIOL', description: 'Molecular mechanisms of life.', prereqs: ['BIOL 200'], gers: [] },
  
  // CHEM Courses
  'CHEM 150': { name: 'General Chemistry I', credits: 4, department: 'CHEM', description: 'Introduction to chemistry.', prereqs: [], gers: ['NS'] },
  'CHEM 151': { name: 'General Chemistry II', credits: 4, department: 'CHEM', description: 'Continuation of general chemistry.', prereqs: ['CHEM 150'], gers: ['NS'] },
  'CHEM 202': { name: 'Organic Chemistry I', credits: 4, department: 'CHEM', description: 'Structure and reactions of organic compounds.', prereqs: ['CHEM 151'], gers: [] },
  'CHEM 203': { name: 'Organic Chemistry II', credits: 4, department: 'CHEM', description: 'Continuation of organic chemistry.', prereqs: ['CHEM 202'], gers: [] },
  'CHEM 221': { name: 'Organic Chemistry Lab', credits: 2, department: 'CHEM', description: 'Laboratory techniques in organic chemistry.', prereqs: ['CHEM 202'], gers: [] },
  'CHEM 301': { name: 'Physical Chemistry I', credits: 4, department: 'CHEM', description: 'Thermodynamics and kinetics.', prereqs: ['CHEM 151', 'MATH 211'], gers: [] },
  'CHEM 302': { name: 'Physical Chemistry II', credits: 4, department: 'CHEM', description: 'Quantum chemistry.', prereqs: ['CHEM 301'], gers: [] },
  
  // PHYS Courses
  'PHYS 141': { name: 'Physics I', credits: 4, department: 'PHYS', description: 'Mechanics and thermodynamics.', prereqs: ['MATH 111'], gers: ['NS'] },
  'PHYS 142': { name: 'Physics II', credits: 4, department: 'PHYS', description: 'Electricity and magnetism.', prereqs: ['PHYS 141', 'MATH 112'], gers: ['NS'] },
  'PHYS 250': { name: 'Modern Physics', credits: 4, department: 'PHYS', description: 'Introduction to quantum mechanics and relativity.', prereqs: ['PHYS 142'], gers: [] },
  'PHYS 310': { name: 'Classical Mechanics', credits: 4, department: 'PHYS', description: 'Advanced mechanics.', prereqs: ['PHYS 250', 'MATH 211'], gers: [] },
  'PHYS 320': { name: 'Electromagnetism', credits: 4, department: 'PHYS', description: 'Advanced E&M theory.', prereqs: ['PHYS 250', 'MATH 211'], gers: [] },
  'PHYS 410': { name: 'Quantum Mechanics', credits: 4, department: 'PHYS', description: 'Quantum theory.', prereqs: ['PHYS 310'], gers: [] },
  
  // Other GER and General Courses
  'DSC 101': { name: 'Discovery Seminar', credits: 3, department: 'DSC', description: 'First-year seminar course.', prereqs: [], gers: ['DS'] },
  'ENG 185': { name: 'Writing/Inquiry - Liberal Arts', credits: 3, department: 'ENG', description: 'First-year writing course.', prereqs: [], gers: ['FYW'] },
  'ENG 101': { name: 'Expository Writing', credits: 3, department: 'ENG', description: 'Academic writing skills.', prereqs: [], gers: ['FYW'] },
  'ENG 181': { name: 'Writing About Literature', credits: 3, department: 'ENG', description: 'Literary analysis and writing.', prereqs: [], gers: ['FYW'] },
  'PE 122': { name: 'Beginning Tennis', credits: 1, department: 'PE', description: 'Introduction to tennis.', prereqs: [], gers: ['PE'] },
  'PE 101': { name: 'Fitness Walking', credits: 1, department: 'PE', description: 'Walking for fitness.', prereqs: [], gers: ['PE'] },
  'PE 115': { name: 'Yoga', credits: 1, department: 'PE', description: 'Introduction to yoga practice.', prereqs: [], gers: ['PE'] },
  'PE 130': { name: 'Swimming', credits: 1, department: 'PE', description: 'Swimming techniques.', prereqs: [], gers: ['PE'] },
  'MUS 213': { name: 'Globalization of Gospel Music', credits: 3, department: 'MUS', description: 'Study of gospel music traditions.', prereqs: [], gers: ['HA', 'RE'] },
  'MUS 114': { name: 'Music Theory I', credits: 3, department: 'MUS', description: 'Fundamentals of music theory.', prereqs: [], gers: ['HA'] },
  'MUS 115': { name: 'Music Theory II', credits: 3, department: 'MUS', description: 'Continuation of music theory.', prereqs: ['MUS 114'], gers: ['HA'] },
  'ART 101': { name: 'Introduction to Art', credits: 3, department: 'ART', description: 'Survey of art history.', prereqs: [], gers: ['HA'] },
  'ART 201': { name: 'Drawing I', credits: 3, department: 'ART', description: 'Fundamentals of drawing.', prereqs: [], gers: ['HA'] },
  'PHIL 120': { name: 'Introduction to Social & Political Philosophy', credits: 3, department: 'PHIL', description: 'Foundations of political thought.', prereqs: [], gers: ['HA'] },
  'PHIL 110': { name: 'Introduction to Philosophy', credits: 3, department: 'PHIL', description: 'Survey of philosophical problems.', prereqs: [], gers: ['HA'] },
  'PHIL 200': { name: 'Ethics', credits: 3, department: 'PHIL', description: 'Moral philosophy.', prereqs: [], gers: ['HA'] },
  'PHIL 210': { name: 'Logic', credits: 3, department: 'PHIL', description: 'Formal logic and reasoning.', prereqs: [], gers: ['HA'] },
  'REL 100': { name: 'Introduction to Religion', credits: 3, department: 'REL', description: 'Survey of world religions.', prereqs: [], gers: ['HA'] },
  'REL 348W': { name: 'New Testament In Its Context', credits: 4, department: 'REL', description: 'Study of New Testament texts.', prereqs: [], gers: ['HA', 'W'] },
  'HIST 110': { name: 'World History I', credits: 3, department: 'HIST', description: 'World history to 1500.', prereqs: [], gers: ['HA'] },
  'HIST 111': { name: 'World History II', credits: 3, department: 'HIST', description: 'World history since 1500.', prereqs: [], gers: ['HA'] },
  'HIST 201': { name: 'American History I', credits: 3, department: 'HIST', description: 'US history to 1877.', prereqs: [], gers: ['HA'] },
  'HIST 202': { name: 'American History II', credits: 3, department: 'HIST', description: 'US history since 1877.', prereqs: [], gers: ['HA'] },
  'POLS 110': { name: 'Introduction to Political Science', credits: 3, department: 'POLS', description: 'Survey of political science.', prereqs: [], gers: ['SS'] },
  'POLS 210': { name: 'American Government', credits: 3, department: 'POLS', description: 'US political system.', prereqs: [], gers: ['SS'] },
  'POLS 220': { name: 'Comparative Politics', credits: 3, department: 'POLS', description: 'Comparing political systems.', prereqs: [], gers: ['SS'] },
  'POLS 230': { name: 'International Relations', credits: 3, department: 'POLS', description: 'Global politics.', prereqs: [], gers: ['SS'] },
  'SOC 101': { name: 'Introduction to Sociology', credits: 3, department: 'SOC', description: 'Survey of sociology.', prereqs: [], gers: ['SS'] },
  'SOC 210': { name: 'Social Research Methods', credits: 3, department: 'SOC', description: 'Research methodology.', prereqs: ['SOC 101'], gers: [] },
  'SOC 220': { name: 'Social Inequality', credits: 3, department: 'SOC', description: 'Class, race, and gender.', prereqs: ['SOC 101'], gers: ['SS'] },
  'ANT 101': { name: 'Introduction to Anthropology', credits: 3, department: 'ANT', description: 'Survey of anthropology.', prereqs: [], gers: ['SS'] },
  'GER 101': { name: 'Elementary German I', credits: 4, department: 'GER', description: 'Beginning German language.', prereqs: [], gers: ['IC'] },
  'GER 102': { name: 'Elementary German II', credits: 4, department: 'GER', description: 'Continuation of German.', prereqs: ['GER 101'], gers: ['IC'] },
  'SPAN 101': { name: 'Elementary Spanish I', credits: 4, department: 'SPAN', description: 'Beginning Spanish language.', prereqs: [], gers: ['IC'] },
  'SPAN 102': { name: 'Elementary Spanish II', credits: 4, department: 'SPAN', description: 'Continuation of Spanish.', prereqs: ['SPAN 101'], gers: ['IC'] },
  'FREN 101': { name: 'Elementary French I', credits: 4, department: 'FREN', description: 'Beginning French language.', prereqs: [], gers: ['IC'] },
  'FREN 102': { name: 'Elementary French II', credits: 4, department: 'FREN', description: 'Continuation of French.', prereqs: ['FREN 101'], gers: ['IC'] },
  'CHIN 101': { name: 'Elementary Chinese I', credits: 4, department: 'CHIN', description: 'Beginning Chinese language.', prereqs: [], gers: ['IC'] },
  'CHIN 102': { name: 'Elementary Chinese II', credits: 4, department: 'CHIN', description: 'Continuation of Chinese.', prereqs: ['CHIN 101'], gers: ['IC'] },
  'JPN 101': { name: 'Elementary Japanese I', credits: 4, department: 'JPN', description: 'Beginning Japanese language.', prereqs: [], gers: ['IC'] },
  'JPN 102': { name: 'Elementary Japanese II', credits: 4, department: 'JPN', description: 'Continuation of Japanese.', prereqs: ['JPN 101'], gers: ['IC'] },
  'HLTH 250': { name: 'Foundations in Global Health', credits: 3, department: 'HLTH', description: 'Introduction to global health issues.', prereqs: [], gers: [] },
  'HLTH 300': { name: 'Epidemiology', credits: 3, department: 'HLTH', description: 'Study of disease patterns.', prereqs: ['HLTH 250'], gers: [] },
  'HLTH 320': { name: 'Health Policy', credits: 3, department: 'HLTH', description: 'Healthcare policy analysis.', prereqs: ['HLTH 250'], gers: [] },
  'NBB 201': { name: 'Neuroscience and Behavior', credits: 4, department: 'NBB', description: 'Introduction to neuroscience.', prereqs: ['BIOL 141'], gers: ['NS'] },
  'NBB 301': { name: 'Cellular Neuroscience', credits: 4, department: 'NBB', description: 'Neural cell biology.', prereqs: ['NBB 201'], gers: [] },
  'ENVS 131': { name: 'Introduction to Environmental Science', credits: 4, department: 'ENVS', description: 'Environmental science fundamentals.', prereqs: [], gers: ['NS'] },
  'ENVS 230': { name: 'Environmental Policy', credits: 3, department: 'ENVS', description: 'Environmental policy analysis.', prereqs: ['ENVS 131'], gers: [] },
  'INTERN 496R': { name: 'Pathways XA Internship', credits: 1, department: 'INTERN', description: 'Experiential learning internship.', prereqs: [], gers: ['E'] },
};

// Emory GER Requirements
const GER_REQUIREMENTS = {
  'Discovery Seminar': { required: 1, credits: 3, description: '1st Semester' },
  'First-Year Writing': { required: 1, credits: 3, description: '1st Year' },
  'PE': { required: 1, credits: 1, description: '1st Year' },
  'Humanities & Arts (HA)': { required: 1, credits: 3, description: 'By Oxford Graduation' },
  'Natural Sciences (NS)': { required: 1, credits: 3, description: 'By Oxford Graduation' },
  'Quantitative Reasoning (QR)': { required: 1, credits: 3, description: 'By Oxford Graduation' },
  'Social Sciences (SS)': { required: 1, credits: 3, description: 'By Oxford Graduation' },
  'Experiential (E)': { required: 1, credits: 3, description: 'By Oxford Graduation' },
  'Intercultural Communication': { required: 2, credits: 6, description: 'Year 3' },
  'Race & Ethnicity': { required: 1, credits: 3, description: 'Year 3' },
  'Continued Communication (W)': { required: 2, credits: 6, description: 'By Graduation' }
};

// Sample Major Requirements Database
const MAJOR_REQUIREMENTS = {
  'QSS (Quantitative Sciences)': {
    totalCredits: 47,
    core: [
      { code: 'MATH 111', name: 'Calculus I', credits: 3, prereq: true },
      { code: 'MATH 221', name: 'Linear Algebra', credits: 4, prereq: true },
      { code: 'QTM 110', name: 'Intro to Scientific Methods', credits: 3 },
      { code: 'MATH 210', name: 'Advanced Calculus for Data Sciences', credits: 4 },
      { code: 'QTM 150', name: 'Intro to Statistical Computing I', credits: 2 },
      { code: 'QTM 151', name: 'Intro to Statistical Computing II', credits: 2 },
      { code: 'QTM 210', name: 'Probability & Statistics', credits: 4 },
      { code: 'QTM 220', name: 'Regression Analysis', credits: 4 }
    ],
    electives: { required: 3, minCredits: 9, description: '300-400 level QTM courses' }
  },
  'Economics': {
    totalCredits: 36,
    core: [
      { code: 'ECON 101', name: 'Principles of Microeconomics', credits: 3 },
      { code: 'ECON 112', name: 'Principles of Macroeconomics', credits: 3 },
      { code: 'ECON 201', name: 'Intermediate Microeconomics', credits: 3 },
      { code: 'ECON 212', name: 'Intermediate Macroeconomics', credits: 3 },
      { code: 'ECON 220', name: 'Econometrics', credits: 3 },
      { code: 'MATH 111', name: 'Calculus I', credits: 3 },
      { code: 'MATH 112', name: 'Calculus II', credits: 3 }
    ],
    electives: { required: 5, minCredits: 15, description: '300+ level ECON courses' }
  },
  'Business (BBA)': {
    totalCredits: 63,
    core: [
      // Pre-Business Requirements
      { code: 'BUS 290', name: 'Tech Toolbox A: Excel', credits: 1 },
      { code: 'ECON 101', name: 'Principles of Microeconomics', credits: 3 },
      { code: 'ECON 112', name: 'Principles of Macroeconomics', credits: 3 },
      { code: 'QTM 100', name: 'Statistics (OR QTM 110 OR ECON 220)', credits: 4 },
      // Core (Complete All)
      { code: 'ACT 200', name: 'Financial Accounting', credits: 3 },
      { code: 'ACT 410', name: 'Managerial Accounting', credits: 3 },
      { code: 'BUS 365', name: 'Business Analytics', credits: 3 },
      { code: 'FIN 320', name: 'Corporate Finance', credits: 3 },
      { code: 'ISOM 351', name: 'Information Systems', credits: 3 },
      { code: 'MKT 340', name: 'Marketing Management', credits: 3 },
      { code: 'OAM 330', name: 'Operations Management (OR OAM 331)', credits: 3 },
      // Co-Curricular Core (Complete All - 10 hours)
      { code: 'BUS 300', name: 'BBA Boardroom', credits: 2 },
      { code: 'BUS 380', name: 'Professional Development', credits: 2 },
      { code: 'BUS 381', name: 'Personal Development', credits: 0.5 },
      { code: 'BUS 383', name: 'Team Dynamics and Leadership', credits: 0.5 },
      { code: 'BUS 390', name: 'Tech Tools', credits: 2 },
      { code: 'BUS 480', name: 'Senior Seminars', credits: 2 }
    ],
    electives: { required: 6, minCredits: 18, description: 'Flex Core (pick 2 from ACT 300, FIN 323, ISOM 352, MKT 345, OAM 330/331) + Business concentration electives. One must be experiential immersive.' }
  },
  'Psychology': {
    totalCredits: 32,
    core: [
      { code: 'PSYC 110', name: 'Intro to Psychobiology & Cognition', credits: 3 },
      { code: 'PSYC 111', name: 'Intro to Social & Personality Psychology', credits: 3 },
      { code: 'PSYC 200', name: 'Research Methods', credits: 4 },
      { code: 'PSYC 210', name: 'Statistics for Psychology', credits: 4 }
    ],
    electives: { required: 6, minCredits: 18, description: '200+ level PSYC courses' }
  },
  'Computer Science': {
    totalCredits: 40,
    core: [
      { code: 'CS 170', name: 'Introduction to Computer Science I', credits: 4 },
      { code: 'CS 171', name: 'Introduction to Computer Science II', credits: 4 },
      { code: 'CS 224', name: 'Discrete Structures', credits: 3 },
      { code: 'CS 253', name: 'Data Structures and Algorithms', credits: 3 },
      { code: 'MATH 111', name: 'Calculus I', credits: 3 },
      { code: 'MATH 112', name: 'Calculus II', credits: 3 },
      { code: 'MATH 221', name: 'Linear Algebra', credits: 4 }
    ],
    electives: { required: 4, minCredits: 16, description: '300+ level CS courses' }
  },
  'Data Science': {
    totalCredits: 44,
    core: [
      { code: 'MATH 111', name: 'Calculus I', credits: 3 },
      { code: 'MATH 112', name: 'Calculus II', credits: 3 },
      { code: 'MATH 221', name: 'Linear Algebra', credits: 4 },
      { code: 'QTM 110', name: 'Intro to Scientific Methods', credits: 3 },
      { code: 'QTM 150', name: 'Intro to Statistical Computing I', credits: 2 },
      { code: 'QTM 151', name: 'Intro to Statistical Computing II', credits: 2 },
      { code: 'QTM 210', name: 'Probability & Statistics', credits: 4 },
      { code: 'CS 170', name: 'Introduction to Computer Science I', credits: 4 },
      { code: 'CS 171', name: 'Introduction to Computer Science II', credits: 4 }
    ],
    electives: { required: 4, minCredits: 15, description: 'Data Science electives' }
  },
  'Mathematics': {
    totalCredits: 36,
    core: [
      { code: 'MATH 111', name: 'Calculus I', credits: 3 },
      { code: 'MATH 112', name: 'Calculus II', credits: 3 },
      { code: 'MATH 211', name: 'Multivariable Calculus', credits: 4 },
      { code: 'MATH 221', name: 'Linear Algebra', credits: 4 },
      { code: 'MATH 321', name: 'Abstract Algebra', credits: 4 }
    ],
    electives: { required: 5, minCredits: 18, description: '300+ level MATH courses' }
  },
  'Biology': {
    totalCredits: 40,
    core: [
      { code: 'BIOL 141', name: 'Foundations of Modern Biology I', credits: 4 },
      { code: 'CHEM 150', name: 'General Chemistry I', credits: 4 },
      { code: 'MATH 111', name: 'Calculus I', credits: 3 }
    ],
    electives: { required: 7, minCredits: 29, description: '200+ level BIOL courses' }
  },
  'Chemistry': {
    totalCredits: 38,
    core: [
      { code: 'CHEM 150', name: 'General Chemistry I', credits: 4 },
      { code: 'MATH 111', name: 'Calculus I', credits: 3 },
      { code: 'MATH 112', name: 'Calculus II', credits: 3 }
    ],
    electives: { required: 7, minCredits: 28, description: '200+ level CHEM courses' }
  },
  'Philosophy': {
    totalCredits: 30,
    core: [
      { code: 'PHIL 120', name: 'Introduction to Social & Political Philosophy', credits: 3 }
    ],
    electives: { required: 9, minCredits: 27, description: '200+ level PHIL courses' }
  },
  'Religion': {
    totalCredits: 30,
    core: [
      { code: 'REL 348W', name: 'New Testament In Its Context', credits: 4 }
    ],
    electives: { required: 8, minCredits: 26, description: '200+ level REL courses' }
  },
  'Music': {
    totalCredits: 32,
    core: [
      { code: 'MUS 213', name: 'Globalization of Gospel Music', credits: 3 }
    ],
    electives: { required: 9, minCredits: 29, description: '200+ level MUS courses' }
  },
  'Global Health': {
    totalCredits: 36,
    core: [
      { code: 'HLTH 250', name: 'Foundations in Global Health', credits: 3 },
      { code: 'BIOL 141', name: 'Foundations of Modern Biology I', credits: 4 },
      { code: 'QTM 110', name: 'Intro to Scientific Methods', credits: 3 }
    ],
    electives: { required: 8, minCredits: 26, description: '200+ level HLTH courses' }
  }
};

// Course to GER mapping
const COURSE_GER_MAP = {
  'DSC': { category: 'Discovery Seminar' },
  'ENG 1': { category: 'First-Year Writing' },
  'PE': { category: 'PE' },
  'MUS': { category: 'Humanities & Arts (HA)' },
  'ART': { category: 'Humanities & Arts (HA)' },
  'PHIL': { category: 'Humanities & Arts (HA)' },
  'REL': { category: 'Humanities & Arts (HA)' },
  'HIST': { category: 'Humanities & Arts (HA)' },
  'BIOL': { category: 'Natural Sciences (NS)' },
  'CHEM': { category: 'Natural Sciences (NS)' },
  'PHYS': { category: 'Natural Sciences (NS)' },
  'MATH': { category: 'Quantitative Reasoning (QR)' },
  'QTM': { category: 'Quantitative Reasoning (QR)' },
  'ECON': { category: 'Social Sciences (SS)' },
  'PSYC': { category: 'Social Sciences (SS)' },
  'SOC': { category: 'Social Sciences (SS)' },
  'POLS': { category: 'Social Sciences (SS)' }
};

// Normalize course codes for comparison
const normalizeCourseCode = (code) => {
  return code
    .replace(/_OX/g, '')
    .replace(/\s+/g, ' ')
    .replace(/(\d+)[A-Z]$/, '$1')
    .trim()
    .toUpperCase();
};

// Check if two courses match
const coursesMatch = (code1, code2) => {
  const n1 = normalizeCourseCode(code1);
  const n2 = normalizeCourseCode(code2);
  
  // Direct match
  if (n1 === n2) return true;
  
  // Extract department and number
  const parse = (code) => {
    const match = code.match(/^([A-Z]+)\s*(\d+)/);
    return match ? { dept: match[1], num: match[2] } : null;
  };
  
  const p1 = parse(n1);
  const p2 = parse(n2);
  
  if (p1 && p2) {
    return p1.dept === p2.dept && p1.num === p2.num;
  }
  
  return false;
};

// Check if a transcript course satisfies a requirement (handles OR alternatives)
const coursesSatisfyRequirement = (transcriptCode, requirementCode) => {
  // Direct match first
  if (coursesMatch(transcriptCode, requirementCode)) return true;
  
  // Check for OR alternatives in the requirement name/code
  // Common patterns: "QTM 100 (OR QTM 110 OR ECON 220)", "OAM 330 (OR OAM 331)"
  const orAlternatives = {
    'QTM 100': ['QTM 100', 'QTM 110', 'ECON 220'],
    'OAM 330': ['OAM 330', 'OAM 331'],
    'ECON 371': ['ECON 371', 'ECON 372', 'HLTH 370'],
    'HLTH 333': ['HLTH 333', 'HLTH 335', 'HLTH 385'],
  };
  
  // Check if the requirement has alternatives
  const reqNorm = normalizeCourseCode(requirementCode);
  for (const [baseReq, alternatives] of Object.entries(orAlternatives)) {
    if (coursesMatch(reqNorm, baseReq)) {
      // Check if transcript course matches any alternative
      for (const alt of alternatives) {
        if (coursesMatch(transcriptCode, alt)) return true;
      }
    }
  }
  
  return false;;
};

export default function EmoryMajorPlanner() {
  const [transcriptData, setTranscriptData] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [parsing, setParsing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [majorSearchQuery, setMajorSearchQuery] = useState('');
  
  // Custom Major states
  const [customMajorName, setCustomMajorName] = useState('');
  const [customMajorCourses, setCustomMajorCourses] = useState([]);
  const [customMajorElectives, setCustomMajorElectives] = useState({ required: 0, description: '' });
  const [customMajorError, setCustomMajorError] = useState('');
  const [parsingCustomImage, setParsingCustomImage] = useState(false);
  const [uploadedImageData, setUploadedImageData] = useState(null);

  // Parse transcript text
  const parseTranscript = (text) => {
    const courses = [];
    
    // Normalize the text - handle both newline-separated and space-separated formats
    // PDF extraction often puts everything on one line with spaces
    let normalizedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    
    // Extract student name
    let studentName = 'Student';
    const nameMatch = text.match(/Name\s*:\s*([A-Za-z,\s]+?)(?:\s+Student|\s+SSN|\n)/i);
    if (nameMatch) {
      // Convert "Chen,Timothy K" to "Timothy Chen"
      const nameParts = nameMatch[1].trim().split(',');
      if (nameParts.length >= 2) {
        studentName = `${nameParts[1].trim().split(' ')[0]} ${nameParts[0].trim()}`;
      } else {
        studentName = nameMatch[1].trim();
      }
    }
    
    // Extract GPA
    let gpa = 0;
    const gpaMatch = text.match(/(?:CUM|TERM|Career)\s*GPA\s*:\s*(\d+\.\d+)/i);
    if (gpaMatch) {
      gpa = parseFloat(gpaMatch[1]);
    }
    
    // Extract total credits
    let totalCredits = 0;
    const creditsMatch = text.match(/CUM\s*TOTALS?\s*:\s*[\d.]+\s+([\d.]+)/i);
    if (creditsMatch) {
      totalCredits = parseFloat(creditsMatch[1]);
    }
    
    // Course patterns for Emory transcripts
    // Pattern 1: Standard format - DEPT_OX 123 Course Name 3.00 3.00 A
    // Pattern 2: In-progress courses - DEPT_OX 123 Course Name 3.00
    // Pattern 3: Test credits - DEPT 123 Course Name 0.00 T or with credits
    
    const coursePatterns = [
      // Pattern with grade and quality points: ECON_OX 101 Principles Of Microeconomics 3.00 3.00 A- 11.100
      /([A-Z_]+)\s+(\d+[A-Z]?[RW]?)\s+([A-Za-z][A-Za-z0-9\s&:,.'\/\-]+?)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+([A-Z][+-]?|S|U|T)\s+[\d.]+/g,
      // Pattern with grade, no quality points: ECON_OX 112 Principles Of Macroeconomics 3.00 3.00 T
      /([A-Z_]+)\s+(\d+[A-Z]?[RW]?)\s+([A-Za-z][A-Za-z0-9\s&:,.'\/\-]+?)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+([A-Z][+-]?|S|U|T)(?:\s|$)/g,
      // Pattern for in-progress courses: ACT_OX 200 Accounting:The Language of Bus 3.00
      /([A-Z_]+)\s+(\d+[A-Z]?[RW]?)\s+([A-Za-z][A-Za-z0-9\s&:,.'\/\-]+?)\s+(\d+\.?\d*)(?:\s+(?:TERM|CUM|$|\n|[A-Z_]+\s+\d))/g,
      // Pattern for test credits with 0.00: BIOL 141 Foundations of Modern Biol I 0.00 T
      /([A-Z_]+)\s+(\d+[A-Z]?[RW]?)\s+([A-Za-z][A-Za-z0-9\s&:,.'\/\-]+?)\s+(0\.00)\s+([A-Z])/g,
    ];
    
    const seenCourses = new Set();
    
    for (const pattern of coursePatterns) {
      let match;
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(text)) !== null) {
        const [fullMatch, dept, num, name, credits, earnedOrGrade, gradeOrNull] = match;
        
        // Skip if this looks like header text or other non-course content
        if (name.includes('TERM') || name.includes('Transfer') || name.includes('Credit') || 
            name.includes('GPA') || name.includes('Page') || name.includes('Print') ||
            name.includes('Undergraduate') || name.includes('Associate') || name.length < 3) {
          continue;
        }
        
        // Determine credits and grade based on which pattern matched
        let creditVal, earnedVal, grade;
        
        if (gradeOrNull && /^[A-Z][+-]?$|^[STU]$/.test(gradeOrNull)) {
          // Pattern with separate earned credits and grade
          creditVal = parseFloat(credits);
          earnedVal = parseFloat(earnedOrGrade);
          grade = gradeOrNull;
        } else if (/^[A-Z][+-]?$|^[STU]$/.test(earnedOrGrade)) {
          // Pattern where earnedOrGrade is actually the grade (for 0.00 credit courses)
          creditVal = parseFloat(credits);
          earnedVal = 0;
          grade = earnedOrGrade;
        } else if (earnedOrGrade) {
          // Pattern with earned credits but no grade (in progress)
          creditVal = parseFloat(credits);
          earnedVal = parseFloat(earnedOrGrade);
          grade = 'IP';
        } else {
          // In-progress course with only attempted credits
          creditVal = parseFloat(credits);
          earnedVal = 0;
          grade = 'IP';
        }
        
        const courseCode = `${dept.replace('_OX', '')} ${num}`;
        
        // Skip duplicates
        if (seenCourses.has(courseCode)) continue;
        seenCourses.add(courseCode);
        
        courses.push({
          code: courseCode,
          rawCode: `${dept} ${num}`,
          name: name.trim(),
          credits: earnedVal > 0 ? earnedVal : creditVal,
          attemptedCredits: creditVal,
          grade: grade,
          completed: grade && grade !== 'IP',
          noCredit: earnedVal === 0 && creditVal > 0 && grade === 'T'
        });
      }
    }
    
    // If still no courses found, try line-by-line parsing
    if (courses.length === 0) {
      const lines = normalizedText.split('\n');
      const linePattern = /^([A-Z_]+)\s+(\d+[A-Z]?[RW]?)\s+(.+?)\s+(\d+\.?\d*)\s*(\d+\.?\d*)?\s*([A-Z][+-]?|S|U|T|IP)?$/;
      
      for (const line of lines) {
        const match = line.trim().match(linePattern);
        if (match) {
          const [_, dept, num, name, credits, earned, grade] = match;
          if (dept && num && name && credits && name.length > 2) {
            const courseCode = `${dept.replace('_OX', '')} ${num}`;
            if (!seenCourses.has(courseCode)) {
              seenCourses.add(courseCode);
              const creditVal = parseFloat(credits);
              const earnedVal = earned ? parseFloat(earned) : creditVal;
              
              courses.push({
                code: courseCode,
                rawCode: `${dept} ${num}`,
                name: name.trim(),
                credits: earnedVal,
                attemptedCredits: creditVal,
                grade: grade || 'IP',
                completed: grade && grade !== 'IP',
                noCredit: earnedVal === 0 && creditVal > 0
              });
            }
          }
        }
      }
    }
    
    // Calculate GPA if not found
    if (gpa === 0 && courses.length > 0) {
      const gradePoints = { 'A': 4, 'A-': 3.7, 'B+': 3.3, 'B': 3, 'B-': 2.7, 'C+': 2.3, 'C': 2, 'C-': 1.7, 'D+': 1.3, 'D': 1, 'F': 0 };
      let totalPoints = 0;
      let totalGradedCredits = 0;
      
      for (const course of courses) {
        if (course.grade && gradePoints[course.grade] !== undefined && course.credits > 0) {
          totalPoints += gradePoints[course.grade] * course.credits;
          totalGradedCredits += course.credits;
        }
      }
      
      if (totalGradedCredits > 0) {
        gpa = Math.round((totalPoints / totalGradedCredits) * 1000) / 1000;
      }
    }
    
    // Calculate total credits if not found
    if (totalCredits === 0) {
      totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);
    }
    
    return {
      studentName,
      gpa,
      totalCredits,
      courses
    };
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setParsing(true);
    
    try {
      let text = '';
      
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // Handle PDF files using pdf.js
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const textParts = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          textParts.push(pageText);
        }
        
        text = textParts.join('\n');
      } else {
        // Handle text files
        text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      }
      
      // Parse the transcript
      const result = parseTranscript(text);
      
      if (result.courses.length > 0) {
        setTranscriptData(result);
        setActiveTab('planner');
      } else {
        alert('Could not find any courses in the uploaded file. Please make sure you uploaded your transcript from OPUS.');
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  // Calculate major progress
  const calculateMajorProgress = (majorName) => {
    if (!transcriptData || !majorName) return null;
    
    const major = MAJOR_REQUIREMENTS[majorName];
    if (!major) return null;
    
    const completedCore = [];
    const inProgressCore = [];
    const remainingCore = [];
    let completedCoreCredits = 0;
    let inProgressCoreCredits = 0;
    
    for (const req of major.core) {
      // Use coursesSatisfyRequirement to handle OR alternatives
      // Find any matching course (completed or in-progress)
      const found = transcriptData.courses.find(c => 
        coursesSatisfyRequirement(c.code, req.code) && !c.noCredit
      );
      
      if (found) {
        if (found.grade && found.grade !== 'IP') {
          // Course is completed with a grade
          completedCore.push({ ...req, transcriptMatch: found });
          completedCoreCredits += req.credits;
        } else {
          // Course is in-progress (enrolled but no grade yet)
          inProgressCore.push({ ...req, transcriptMatch: found });
          inProgressCoreCredits += req.credits;
        }
      } else {
        remainingCore.push(req);
      }
    }
    
    const totalCoreCredits = major.core.reduce((sum, c) => sum + c.credits, 0);
    const electiveCreditsNeeded = major.electives.minCredits;
    const totalMajorCredits = totalCoreCredits + electiveCreditsNeeded;
    
    // Progress percent includes both completed and in-progress
    const totalProgress = completedCoreCredits + inProgressCoreCredits;
    
    return {
      majorName,
      completedCore,
      inProgressCore,
      remainingCore,
      completedCoreCredits,
      inProgressCoreCredits,
      totalCoreCredits,
      electiveCreditsNeeded,
      totalMajorCredits,
      progressPercent: Math.round((totalProgress / totalMajorCredits) * 100),
      completedPercent: Math.round((completedCoreCredits / totalMajorCredits) * 100),
      electives: major.electives
    };
  };

  // Calculate GER progress - uses gers tags from COURSE_ATLAS
  const calculateGERProgress = () => {
    if (!transcriptData) return null;
    
    const progress = {};
    let totalCompleted = 0;
    let totalRequired = 0;
    
    // GER tag to category mapping
    const gerTagToCategory = {
      'DS': 'Discovery Seminar',
      'FYW': 'First-Year Writing',
      'PE': 'PE',
      'HA': 'Humanities & Arts (HA)',
      'NS': 'Natural Sciences (NS)',
      'QR': 'Quantitative Reasoning (QR)',
      'SS': 'Social Sciences (SS)',
      'E': 'Experiential (E)',
      'IC': 'Intercultural Communication',
      'RE': 'Race & Ethnicity',
      'W': 'Continued Communication (W)'
    };
    
    for (const [category, req] of Object.entries(GER_REQUIREMENTS)) {
      progress[category] = {
        ...req,
        completed: 0,
        courses: []
      };
      totalRequired += req.required;
    }
    
    // Track which categories each course has been applied to (avoid double counting)
    const courseAssignments = new Map();
    
    // Map courses to GER categories using the gers tags from COURSE_ATLAS
    for (const course of transcriptData.courses) {
      // Skip courses with 0 credits - they don't count for requirements
      if (course.credits === 0 || course.noCredit) continue;
      
      const normalizedCode = normalizeCourseCode(course.code);
      const dept = course.code.split(' ')[0].replace('_OX', '');
      
      // Look up the course in COURSE_ATLAS to get its GER tags
      let gerTags = [];
      
      // Try to find the course in COURSE_ATLAS
      for (const [atlasCode, atlasData] of Object.entries(COURSE_ATLAS)) {
        if (coursesMatch(normalizedCode, atlasCode)) {
          gerTags = atlasData.gers || [];
          break;
        }
      }
      
      // If not found in atlas, use department-based fallback rules
      if (gerTags.length === 0) {
        // Discovery Seminar
        if (course.code.includes('DSC') || course.name.toLowerCase().includes('discovery seminar')) {
          gerTags = ['DS'];
        }
        // First-Year Writing
        else if (course.code.includes('ENG 1') || course.name.toLowerCase().includes('writing')) {
          gerTags = ['FYW'];
        }
        // PE
        else if (dept === 'PE') {
          gerTags = ['PE'];
        }
        // Writing requirement (W courses)
        else if (/\d+W/.test(course.code)) {
          gerTags = ['W'];
        }
        // Experiential
        else if (dept === 'INTERN' || course.name.toLowerCase().includes('internship')) {
          gerTags = ['E'];
        }
        // Natural Sciences (department fallback)
        else if (['BIOL', 'CHEM', 'PHYS', 'ENVS', 'NBB'].includes(dept)) {
          gerTags = ['NS'];
        }
        // Quantitative Reasoning (department fallback)
        else if (['MATH', 'QTM', 'CS', 'DASCI'].includes(dept)) {
          gerTags = ['QR'];
        }
        // Social Sciences (department fallback)
        else if (['ECON', 'SOC', 'POLS', 'ANT'].includes(dept)) {
          gerTags = ['SS'];
        }
        // PSYC can be NS or SS depending on course - PSYC 110 is NS, PSYC 111 is SS
        else if (dept === 'PSYC') {
          if (course.code.includes('110')) {
            gerTags = ['NS'];
          } else if (course.code.includes('111')) {
            gerTags = ['SS'];
          } else {
            gerTags = ['SS']; // Default PSYC to SS
          }
        }
        // Humanities & Arts (department fallback)
        else if (['MUS', 'ART', 'THEA', 'FILM', 'PHIL', 'REL', 'HIST', 'ENG', 'CLAS'].includes(dept)) {
          gerTags = ['HA'];
        }
        // Foreign languages
        else if (['GER', 'SPAN', 'FREN', 'CHIN', 'JPN', 'JAPN', 'KOR', 'ARAB', 'PORT', 'ITAL', 'RUSS'].includes(dept)) {
          gerTags = ['IC'];
        }
      }
      
      // Apply each GER tag to the appropriate category
      for (const tag of gerTags) {
        const category = gerTagToCategory[tag];
        if (category && progress[category]) {
          // Only count if we haven't reached the required amount
          if (progress[category].completed < progress[category].required) {
            // Check if this course was already assigned to this category
            const key = `${course.code}-${category}`;
            if (!courseAssignments.has(key)) {
              courseAssignments.set(key, true);
              progress[category].completed++;
              progress[category].courses.push(course);
              totalCompleted++;
            }
          }
        }
      }
    }
    
    return {
      categories: progress,
      totalCompleted: Math.min(totalCompleted, totalRequired),
      totalRequired,
      progressPercent: Math.round((Math.min(totalCompleted, totalRequired) / totalRequired) * 100)
    };
  };

  // Get major recommendations
  const getMajorRecommendations = () => {
    if (!transcriptData) return [];
    
    const recommendations = [];
    
    for (const [majorName, major] of Object.entries(MAJOR_REQUIREMENTS)) {
      const progress = calculateMajorProgress(majorName);
      // Show majors where user has completed OR is taking any core courses
      const totalMatched = progress ? (progress.completedCore.length + (progress.inProgressCore?.length || 0)) : 0;
      
      if (progress && totalMatched > 0) {
        // Calculate total courses needed (core + electives)
        const totalCoursesRequired = major.core.length + (major.electives.required || 0);
        // Calculate percentage based on courses completed + in-progress vs total required
        const matchPercent = Math.round((totalMatched / totalCoursesRequired) * 100);
        
        recommendations.push({
          major: majorName,
          matchedCourses: totalMatched,
          completedCourses: progress.completedCore.length,
          inProgressCourses: progress.inProgressCore?.length || 0,
          totalRequired: totalCoursesRequired,
          coreRequired: major.core.length,
          remainingCourses: progress.remainingCore.length,
          electivesRequired: major.electives.required || 0,
          creditsCompleted: progress.completedCoreCredits,
          creditsInProgress: progress.inProgressCoreCredits || 0,
          totalCredits: progress.totalMajorCredits,
          matchPercent: matchPercent
        });
      }
    }
    
    // Sort by: 1) Most matched courses first (completed + in-progress), 2) Then by percentage
    return recommendations.sort((a, b) => {
      // Primary: more matched courses = higher priority
      if (b.matchedCourses !== a.matchedCourses) {
        return b.matchedCourses - a.matchedCourses;
      }
      // Secondary: higher percentage = higher priority
      return b.matchPercent - a.matchPercent;
    });
  };

  // Progress Bar Component
  const ProgressBar = ({ percent, label, sublabel, color = '#004990' }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-medium" style={{ color }}>{percent}%</span>
      </div>
      {sublabel && <p className="text-xs text-gray-500 mb-1">{sublabel}</p>}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="h-3 rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );

  const gerProgress = calculateGERProgress();
  const majorProgress = selectedMajor ? calculateMajorProgress(selectedMajor) : null;
  const recommendations = getMajorRecommendations();

  // Emory Shield Logo
  const EmoryLogo = () => (
    <img 
      src="data:image/png;base64,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"
      alt="Emory University"
      className="h-14 w-auto"
    />
  );



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="text-white py-6 px-4 shadow-lg" style={{ backgroundColor: '#004990' }}>
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <EmoryLogo />
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Crimson Pro', serif" }}>Emory Major Planner</h1>
            <p className="text-blue-100 mt-1" style={{ fontStyle: 'italic' }}>The wise heart seeks knowledge.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-white font-medium hover:bg-white/30"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Help</span>
            </button>
            <button
              onClick={() => setShowPrivacy(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-white font-medium hover:bg-white/30"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Privacy</span>
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-white font-medium hover:bg-white/30"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Reset Confirmation Modal */}
      {/* Reset Sweep Animation Overlay */}
      {isResetting && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {/* Sweep wave */}
          <div 
            className="absolute inset-y-0 w-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(0, 73, 144, 0.8) 40%, rgba(0, 73, 144, 1) 50%, rgba(0, 73, 144, 0.8) 60%, transparent 100%)',
              animation: 'sweepAcross 2s ease-in-out forwards'
            }}
          />
          
          {/* Main sparkle particles - travel with the wave */}
          {[...Array(40)].map((_, i) => (
            <div
              key={`spark-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${4 + Math.random() * 8}px`,
                height: `${4 + Math.random() * 8}px`,
                background: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#FFF8DC' : '#F0E68C',
                left: '-5%',
                top: `${3 + (i * 2.4)}%`,
                animation: 'sparkleSweep 2s ease-in-out forwards',
                animationDelay: `${(i % 10) * 0.02}s`,
                opacity: 0,
                boxShadow: '0 0 6px 2px rgba(255, 215, 0, 0.6)'
              }}
            />
          ))}
          
          {/* Extra scattered sparkles - also sweep across */}
          {[...Array(30)].map((_, i) => (
            <div
              key={`extra-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${3 + Math.random() * 5}px`,
                height: `${3 + Math.random() * 5}px`,
                background: '#FFFFFF',
                left: '-5%',
                top: `${Math.random() * 100}%`,
                animation: 'sparkleSweepScatter 2s ease-in-out forwards',
                animationDelay: `${0.05 + (i * 0.03)}s`,
                opacity: 0,
                boxShadow: '0 0 4px 1px rgba(255, 255, 255, 0.8)'
              }}
            />
          ))}
          
          {/* Trailing glow particles - sweep across */}
          {[...Array(20)].map((_, i) => (
            <div
              key={`glow-${i}`}
              className="absolute rounded-full"
              style={{
                width: '14px',
                height: '14px',
                background: 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, transparent 70%)',
                left: '-5%',
                top: `${5 + (i * 4.5)}%`,
                animation: 'glowSweep 2s ease-in-out forwards',
                animationDelay: `${(i % 8) * 0.025}s`,
                opacity: 0
              }}
            />
          ))}
          
          <style>{`
            @keyframes sweepAcross {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            @keyframes sparkleSweep {
              0% { transform: translateX(0) scale(0) rotate(0deg); opacity: 0; }
              10% { transform: translateX(10vw) scale(1.2) rotate(45deg); opacity: 1; }
              90% { transform: translateX(95vw) scale(1.2) rotate(315deg); opacity: 1; }
              100% { transform: translateX(105vw) scale(0) rotate(360deg); opacity: 0; }
            }
            @keyframes sparkleSweepScatter {
              0% { transform: translateX(0) translateY(0) scale(0) rotate(0deg); opacity: 0; }
              10% { transform: translateX(10vw) translateY(0) scale(1.5) rotate(90deg); opacity: 1; }
              50% { transform: translateX(50vw) translateY(-20px) scale(1.2) rotate(180deg); opacity: 1; }
              90% { transform: translateX(95vw) translateY(10px) scale(1.5) rotate(270deg); opacity: 1; }
              100% { transform: translateX(105vw) translateY(0) scale(0) rotate(360deg); opacity: 0; }
            }
            @keyframes glowSweep {
              0% { transform: translateX(0) scale(0.5); opacity: 0; }
              10% { transform: translateX(10vw) scale(1.5); opacity: 0.8; }
              90% { transform: translateX(95vw) scale(1.5); opacity: 0.8; }
              100% { transform: translateX(105vw) scale(0.5); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reset Planner?</h3>
            <p className="text-gray-600 mb-6">
              This will clear all your data including uploaded transcript, selected courses, and major selections. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setIsResetting(true);
                  
                  // Wait for animation, then reset
                  setTimeout(() => {
                    setTranscriptData(null);
                    setSelectedMajor('');
                    setActiveTab('upload');
                    setCustomMajorName('');
                    setCustomMajorCourses([]);
                    setCustomMajorElectives({ required: 0, description: '' });
                    
                    // End animation after reset
                    setTimeout(() => {
                      setIsResetting(false);
                    }, 500);
                  }, 1400);
                }}
                className="px-4 py-2 rounded-lg text-white transition-colors"
                style={{ backgroundColor: '#004990' }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold" style={{ color: '#004990' }}>How to Use Emory Major Planner</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="text-3xl">📄</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">1. Upload Your Transcript</h4>
                    <p className="text-gray-600">Download your unofficial transcript from OPUS as a PDF or TXT file, then upload it here. We'll automatically extract your courses, grades, and credits.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="text-3xl">📊</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">2. Explore Major Recommendations</h4>
                    <p className="text-gray-600">Based on courses you've already taken, we'll show you which majors you're making progress toward. Click any major to see completed vs. remaining requirements.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="text-3xl">🎯</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">3. Track Custom Majors</h4>
                    <p className="text-gray-600">Planning a double major or joint degree? Use the Custom Major tab to track progress for any combination. Upload a requirements sheet or use our templates.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="text-3xl">✅</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">4. Check GER Progress</h4>
                    <p className="text-gray-600">See which General Education Requirements you've fulfilled and which ones you still need to complete before graduation.</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-800 mb-2">💡 Tips</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Your data stays in your browser - refresh to keep it, or hit Reset to start over</li>
                    <li>• Course requirements are based on 2024-2025 catalog - always verify with your advisor</li>
                    <li>• This tool is for planning purposes only - consult OPUS for official degree audit</li>
                  </ul>
                </div>
              </div>
              
              <button
                onClick={() => setShowHelp(false)}
                className="mt-6 w-full py-3 rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: '#004990' }}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold" style={{ color: '#004990' }}>Privacy & Data Security</h3>
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h4 className="font-bold text-green-800">Your Data Stays Private</h4>
                  </div>
                  <p className="text-green-700">All transcript processing happens locally in your browser. Your academic data is never sent to or stored on any external server.</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">What we DON'T do:</h4>
                  <ul className="text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">✗</span>
                      <span>We don't upload your transcript to any server</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">✗</span>
                      <span>We don't store your name, grades, or course history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">✗</span>
                      <span>We don't share any data with third parties</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">✗</span>
                      <span>We don't use cookies or tracking</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">What we DO:</h4>
                  <ul className="text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Process your transcript entirely in your browser</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Keep your data only in your current browser session</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Clear all data when you close the tab or hit Reset</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-bold text-yellow-800 mb-1">⚠️ Note on Custom Major Image Upload</h4>
                  <p className="text-yellow-700 text-sm">If you use the "Upload Requirements Sheet" feature in Custom Major, the image is sent to an AI service for text extraction. This is the only feature that transmits data externally. Your main transcript is never sent anywhere.</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowPrivacy(false)}
                className="mt-6 w-full py-3 rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: '#004990' }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex justify-center space-x-8 overflow-x-auto">
            {[
              { id: 'upload', label: '📄 Upload Transcript' },
              { id: 'planner', label: '📊 Major Planner' },
              { id: 'custom', label: '🎯 Custom Major' },
              { id: 'ger', label: '✅ GER Progress' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-900 text-blue-900 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                style={activeTab === tab.id ? { borderColor: '#004990', color: '#004990' } : {}}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className={`max-w-6xl mx-auto px-4 py-8 transition-opacity duration-300 ${isResetting ? 'opacity-0' : 'opacity-100'}`}>
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-bold mb-6" style={{ color: '#004990', fontFamily: "'Crimson Pro', serif" }}>
              Upload Your Transcript
            </h2>
            
            {/* Parsing Animation */}
            {parsing ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="relative w-64 h-80 mb-8">
                  {/* Document */}
                  <div className="absolute inset-0 bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden">
                    {/* Fake text lines on document */}
                    <div className="p-4 space-y-2">
                      {[...Array(12)].map((_, i) => (
                        <div 
                          key={i} 
                          className="h-2 bg-gray-200 rounded"
                          style={{ width: `${60 + Math.random() * 35}%` }}
                        />
                      ))}
                    </div>
                    
                    {/* Scanning line */}
                    <div 
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                      style={{
                        animation: 'scanLine 1.5s ease-in-out infinite',
                        boxShadow: '0 0 15px 3px rgba(0, 73, 144, 0.5)'
                      }}
                    />
                  </div>
                  
                  {/* Floating course chips */}
                  {['MATH 111', 'ECON 101', 'CS 170', 'PSYC 110', 'QTM 100'].map((code, i) => (
                    <div
                      key={code}
                      className="absolute px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded shadow-md"
                      style={{
                        animation: `floatChip${i} 2s ease-out infinite`,
                        animationDelay: `${i * 0.3}s`,
                        left: '50%',
                        top: '40%',
                        opacity: 0
                      }}
                    >
                      {code}
                    </div>
                  ))}
                  
                  {/* Destination boxes on right */}
                  <div className="absolute -right-20 top-1/2 -translate-y-1/2 space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div 
                        key={i}
                        className="w-16 h-6 border-2 border-dashed border-blue-300 rounded bg-blue-50"
                        style={{
                          animation: 'pulse 1.5s ease-in-out infinite',
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <p className="text-lg font-medium text-gray-700 mb-2">Extracting your courses...</p>
                <p className="text-sm text-gray-500">Analyzing transcript data</p>
                
                {/* CSS Keyframes */}
                <style>{`
                  @keyframes scanLine {
                    0% { top: 10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 85%; opacity: 0; }
                  }
                  
                  @keyframes floatChip0 {
                    0% { transform: translate(-50%, 0) scale(0.8); opacity: 0; }
                    20% { transform: translate(-50%, 0) scale(1); opacity: 1; }
                    80% { transform: translate(80px, -60px) scale(1); opacity: 1; }
                    100% { transform: translate(80px, -60px) scale(0.8); opacity: 0; }
                  }
                  @keyframes floatChip1 {
                    0% { transform: translate(-50%, 0) scale(0.8); opacity: 0; }
                    20% { transform: translate(-50%, 0) scale(1); opacity: 1; }
                    80% { transform: translate(85px, 0px) scale(1); opacity: 1; }
                    100% { transform: translate(85px, 0px) scale(0.8); opacity: 0; }
                  }
                  @keyframes floatChip2 {
                    0% { transform: translate(-50%, 0) scale(0.8); opacity: 0; }
                    20% { transform: translate(-50%, 0) scale(1); opacity: 1; }
                    80% { transform: translate(75px, 60px) scale(1); opacity: 1; }
                    100% { transform: translate(75px, 60px) scale(0.8); opacity: 0; }
                  }
                  @keyframes floatChip3 {
                    0% { transform: translate(-50%, 0) scale(0.8); opacity: 0; }
                    20% { transform: translate(-50%, 0) scale(1); opacity: 1; }
                    80% { transform: translate(90px, -30px) scale(1); opacity: 1; }
                    100% { transform: translate(90px, -30px) scale(0.8); opacity: 0; }
                  }
                  @keyframes floatChip4 {
                    0% { transform: translate(-50%, 0) scale(0.8); opacity: 0; }
                    20% { transform: translate(-50%, 0) scale(1); opacity: 1; }
                    80% { transform: translate(70px, 30px) scale(1); opacity: 1; }
                    100% { transform: translate(70px, 30px) scale(0.8); opacity: 0; }
                  }
                  
                  @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                  }
                `}</style>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="transcript-upload"
                />
                <label htmlFor="transcript-upload" className="cursor-pointer">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-lg font-medium text-gray-700">
                    Click to upload your transcript
                  </p>
                  <p className="text-sm text-gray-500 mt-2">PDF or TXT format</p>
                </label>
              </div>
            )}

            {transcriptData && !parsing && (
              <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-bold text-green-800 mb-2">✓ Transcript Loaded</h3>
                <p className="text-green-700">
                  <strong>{transcriptData.studentName}</strong> • GPA: {transcriptData.gpa} • 
                  {transcriptData.courses.length} courses detected
                </p>
              </div>
            )}
          </div>
        )}

        {/* Planner Tab - Combined Rankings + Details */}
        {activeTab === 'planner' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-2" style={{ color: '#004990', fontFamily: "'Crimson Pro', serif" }}>
                Major Planner
              </h2>
              
              {!transcriptData ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <p className="text-yellow-800">Please upload your transcript first to see personalized major recommendations</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">
                    Ranked by how many core requirements you've already completed. Click on a major to see details.
                  </p>

                  {/* Search/Filter */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search majors..."
                      value={majorSearchQuery}
                      onChange={(e) => setMajorSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Rankings List */}
                  <div className="space-y-3">
                    {recommendations
                      .filter(rec => rec.major.toLowerCase().includes(majorSearchQuery.toLowerCase()))
                      .map((rec, i) => {
                        const isExpanded = selectedMajor === rec.major;
                        const progress = isExpanded ? calculateMajorProgress(rec.major) : null;
                        
                        return (
                          <div
                            key={rec.major}
                            className={`border rounded-lg transition-all ${
                              isExpanded ? 'border-blue-300 shadow-md' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {/* Clickable Header */}
                            <div
                              className={`p-4 cursor-pointer ${isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                              onClick={() => setSelectedMajor(isExpanded ? '' : rec.major)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📚'}
                                  </span>
                                  <div>
                                    <h3 className="font-bold text-lg">{rec.major}</h3>
                                    <p className="text-sm text-gray-600">
                                      <span className="text-green-600 font-medium">{rec.completedCourses || rec.matchedCourses} completed</span>
                                      {rec.inProgressCourses > 0 && (
                                        <>
                                          {' · '}
                                          <span className="text-blue-600">{rec.inProgressCourses} in progress</span>
                                        </>
                                      )}
                                      {' · '}
                                      <span className="text-orange-600">{rec.remainingCourses} remaining</span>
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span 
                                    className="text-xl font-bold"
                                    style={{ color: '#004990' }}
                                  >
                                    {rec.matchPercent}%
                                  </span>
                                  <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                    ▼
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all duration-500"
                                    style={{ 
                                      width: `${rec.matchPercent}%`, 
                                      backgroundColor: i === 0 ? '#004990' : i === 1 ? '#1e5a9e' : '#3d7ab8' 
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && progress && (
                              <div className="p-4 border-t bg-white">
                                <div className="grid md:grid-cols-3 gap-4">
                                  {/* Completed Courses */}
                                  <div>
                                    <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                                      <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-sm">✓</span>
                                      Completed ({progress.completedCore.length})
                                    </h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                      {progress.completedCore.map((course, j) => (
                                        <div key={j} className="p-3 bg-green-50 rounded-lg border border-green-200">
                                          <div className="font-medium text-green-800">{course.code}</div>
                                          <div className="text-sm text-green-600">{course.name}</div>
                                          {course.transcriptMatch && (
                                            <div className="text-xs text-green-500 mt-1">
                                              Grade: {course.transcriptMatch.grade}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                      {progress.completedCore.length === 0 && (
                                        <p className="text-sm text-gray-500 italic">No core courses completed yet</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* In-Progress Courses */}
                                  <div>
                                    <h4 className="font-bold text-blue-700 mb-3 flex items-center gap-2">
                                      <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm">⏳</span>
                                      In Progress ({progress.inProgressCore?.length || 0})
                                    </h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                      {progress.inProgressCore?.map((course, j) => (
                                        <div key={j} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                          <div className="font-medium text-blue-800">{course.code}</div>
                                          <div className="text-sm text-blue-600">{course.name}</div>
                                          <div className="text-xs text-blue-500 mt-1">
                                            Currently enrolled
                                          </div>
                                        </div>
                                      ))}
                                      {(!progress.inProgressCore || progress.inProgressCore.length === 0) && (
                                        <p className="text-sm text-gray-500 italic">No courses in progress</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Remaining Courses */}
                                  <div>
                                    <h4 className="font-bold text-orange-700 mb-3 flex items-center gap-2">
                                      <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-sm">!</span>
                                      Remaining ({progress.remainingCore.length})
                                    </h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                      {progress.remainingCore.map((course, j) => (
                                        <div key={j} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                          <div className="font-medium text-orange-800">{course.code}</div>
                                          <div className="text-sm text-orange-600">{course.name}</div>
                                          <div className="text-xs text-orange-500 mt-1">{course.credits} credits</div>
                                        </div>
                                      ))}
                                      {progress.remainingCore.length === 0 && (
                                        <p className="text-sm text-green-600 font-medium">🎉 All core courses done!</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Electives */}
                                <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                  <div className="font-medium text-purple-800">+ Electives Required</div>
                                  <div className="text-sm text-purple-600">
                                    {progress.electives.required} courses ({progress.electives.minCredits} credits)
                                  </div>
                                  <div className="text-xs text-purple-500 mt-1">
                                    {progress.electives.description}
                                  </div>
                                </div>

                                {/* Total Credits Summary */}
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-gray-800">Total Progress for {rec.major}</div>
                                    <div className="text-sm text-gray-600">
                                      <span className="text-green-600">{progress.completedCoreCredits} completed</span>
                                      {progress.inProgressCoreCredits > 0 && (
                                        <span className="text-blue-600"> + {progress.inProgressCoreCredits} in progress</span>
                                      )}
                                      <span> of {progress.totalMajorCredits} required</span>
                                    </div>
                                  </div>
                                  <div className="text-3xl font-bold" style={{ color: '#004990' }}>
                                    {MAJOR_REQUIREMENTS[rec.major]?.totalCredits || progress.totalMajorCredits}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Browse All Majors Link */}
                  {majorSearchQuery && recommendations.filter(rec => 
                    rec.major.toLowerCase().includes(majorSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No matching majors found in your recommendations.</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Try the Course Atlas to explore courses for other majors.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Custom Major Tab */}
        {activeTab === 'custom' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-2" style={{ color: '#004990', fontFamily: "'Crimson Pro', serif" }}>
                Custom Major Tracker
              </h2>
              <p className="text-gray-600 mb-4">
                Track progress for joint majors, dual degrees, or custom academic plans.
              </p>

              {/* Show form if no courses entered yet */}
              {customMajorCourses.length === 0 ? (
                <div className="space-y-6">
                  {/* Dynamic Template Recommendations */}
                  {(() => {
                    // Define all available templates
                    const allTemplates = [
                      {
                        id: 'bba',
                        name: 'BBA (Goizueta)',
                        courses: [
                          // Pre-Business Requirements
                          { code: 'BUS 290', name: 'Tech Toolbox A: Excel', credits: 1 },
                          { code: 'ECON 101', name: 'Principles of Microeconomics', credits: 3 },
                          { code: 'ECON 112', name: 'Principles of Macroeconomics', credits: 3 },
                          { code: 'QTM 100', name: 'Statistics (OR QTM 110 OR ECON 220)', credits: 4 },
                          // Core
                          { code: 'ACT 200', name: 'Financial Accounting', credits: 3 },
                          { code: 'ACT 410', name: 'Managerial Accounting', credits: 3 },
                          { code: 'BUS 365', name: 'Business Analytics', credits: 3 },
                          { code: 'FIN 320', name: 'Corporate Finance', credits: 3 },
                          { code: 'ISOM 351', name: 'Information Systems', credits: 3 },
                          { code: 'MKT 340', name: 'Marketing Management', credits: 3 },
                          { code: 'OAM 330', name: 'Operations Management (OR OAM 331)', credits: 3 },
                          // Co-Curricular Core
                          { code: 'BUS 300', name: 'BBA Boardroom', credits: 2 },
                          { code: 'BUS 380', name: 'Professional Development', credits: 2 },
                          { code: 'BUS 381', name: 'Personal Development', credits: 0.5 },
                          { code: 'BUS 383', name: 'Team Dynamics and Leadership', credits: 0.5 },
                          { code: 'BUS 390', name: 'Tech Tools', credits: 2 },
                          { code: 'BUS 480', name: 'Senior Seminars', credits: 2 }
                        ],
                        electives: { required: 6, description: 'Flex Core (pick 2: ACT 300, FIN 323, ISOM 352, MKT 345, OAM 330/331) + concentration electives. One must be experiential immersive.' }
                      },
                      {
                        id: 'bba-qss',
                        name: 'BBA + QSS Secondary',
                        courses: [
                          { code: 'MATH 111', name: 'Calculus I', credits: 3 },
                          { code: 'QTM 110', name: 'Introduction to Scientific Methods', credits: 3 },
                          { code: 'MATH 210', name: 'Advanced Calculus for Data Sciences', credits: 4 },
                          { code: 'MATH 221', name: 'Linear Algebra', credits: 4 },
                          { code: 'QTM 150', name: 'Intro to Statistical Computing I', credits: 2 },
                          { code: 'QTM 151', name: 'Intro to Statistical Computing II', credits: 2 },
                          { code: 'QTM 210', name: 'Probability & Statistics', credits: 4 },
                          { code: 'QTM 220', name: 'Regression Analysis', credits: 4 }
                        ],
                        electives: { required: 3, description: '300-400 level QTM electives (3+ credit hours each)' }
                      },
                      {
                        id: 'cs-econ',
                        name: 'CS + Economics',
                        courses: [
                          { code: 'CS 170', name: 'Introduction to Computer Science I', credits: 4 },
                          { code: 'CS 171', name: 'Introduction to Computer Science II', credits: 4 },
                          { code: 'CS 224', name: 'Discrete Structures', credits: 3 },
                          { code: 'CS 253', name: 'Data Structures and Algorithms', credits: 3 },
                          { code: 'ECON 101', name: 'Principles of Microeconomics', credits: 3 },
                          { code: 'ECON 112', name: 'Principles of Macroeconomics', credits: 3 },
                          { code: 'ECON 201', name: 'Intermediate Microeconomics', credits: 3 },
                          { code: 'ECON 212', name: 'Intermediate Macroeconomics', credits: 3 },
                          { code: 'ECON 220', name: 'Econometrics', credits: 3 },
                          { code: 'MATH 111', name: 'Calculus I', credits: 3 },
                          { code: 'MATH 112', name: 'Calculus II', credits: 3 },
                          { code: 'MATH 221', name: 'Linear Algebra', credits: 4 }
                        ],
                        electives: { required: 6, description: 'CS 300+ and ECON 300+ electives' }
                      },
                      {
                        id: 'econ-hh',
                        name: 'Econ + Human Health',
                        courses: [
                          { code: 'MATH 111', name: 'Calculus I', credits: 3 },
                          { code: 'ECON 101', name: 'Principles of Microeconomics', credits: 3 },
                          { code: 'ECON 112', name: 'Principles of Macroeconomics', credits: 3 },
                          { code: 'ECON 201', name: 'Intermediate Microeconomics', credits: 4 },
                          { code: 'HLTH 210', name: 'Intro to Predictive Health & Society', credits: 3 },
                          { code: 'HLTH 250', name: 'Foundations of Global Health', credits: 3 },
                          { code: 'ECON 220', name: 'Data Science for Economists', credits: 4 },
                          { code: 'ECON 320', name: 'Econometrics', credits: 4 },
                          { code: 'HLTH 306', name: 'Designing Health Research', credits: 3 },
                          { code: 'ECON 371', name: 'Health Economics (OR ECON 372 OR HLTH 370)', credits: 3 },
                          { code: 'HLTH 333', name: 'American Healthcare Ethics (OR HLTH 335/385)', credits: 3 },
                          { code: 'ECON 470', name: 'Research in Health Economics', credits: 3 }
                        ],
                        electives: { required: 3, description: 'Choose from: HLTH 310, 314, 341, 353, 373, 374, ECON 405, 421, 442, 451, and others' }
                      },
                      {
                        id: 'bio-bs',
                        name: 'Biology BS',
                        courses: [
                          { code: 'BIOL 141', name: 'Foundations of Modern Biology I - Lecture', credits: 3 },
                          { code: 'BIOL 141L', name: 'Foundations of Modern Biology I - Lab', credits: 2 },
                          { code: 'BIOL 142', name: 'Foundations of Modern Biology II - Lecture', credits: 3 },
                          { code: 'BIOL 142L', name: 'Foundations of Modern Biology II - Lab', credits: 2 },
                          { code: 'CHEM 150', name: 'General Chemistry I', credits: 4 },
                          { code: 'CHEM 202', name: 'Organic Chemistry I', credits: 3 },
                          { code: 'CHEM 203', name: 'Organic Chemistry II', credits: 3 },
                          { code: 'PHYS 141', name: 'Physics I with Lab', credits: 4 },
                          { code: 'MATH 111', name: 'Calculus I', credits: 3 },
                          { code: 'MATH 116', name: 'Calculus II (Life Sciences)', credits: 3 },
                          { code: 'QTM 100', name: 'Intro to Statistical Inference', credits: 4 }
                        ],
                        electives: { required: 4, description: 'Biology electives (12+ credits) from columns: Cell & Molecular, Organismal, Ecology & Evolution. One upper-level lab required.' }
                      },
                      {
                        id: 'psych',
                        name: 'Psychology + NBB',
                        courses: [
                          { code: 'PSYC 110', name: 'Intro to Psychobiology & Cognition', credits: 3 },
                          { code: 'PSYC 111', name: 'Intro to Social Psychology', credits: 3 },
                          { code: 'PSYC 200', name: 'Research Methods', credits: 4 },
                          { code: 'PSYC 210', name: 'Statistics for Psychology', credits: 4 },
                          { code: 'NBB 201', name: 'Neuroscience Fundamentals', credits: 3 },
                          { code: 'BIOL 141', name: 'Foundations of Modern Biology I', credits: 3 },
                          { code: 'CHEM 150', name: 'General Chemistry I', credits: 4 }
                        ],
                        electives: { required: 6, description: 'PSYC 200+ and NBB electives' }
                      }
                    ];
                    
                    // Calculate matches for each template
                    const templateMatches = allTemplates.map(template => {
                      let matchedCourses = 0;
                      if (transcriptData) {
                        for (const course of template.courses) {
                          for (const tc of transcriptData.courses) {
                            if (coursesSatisfyRequirement(tc.code, course.code) && tc.credits > 0 && !tc.noCredit) {
                              matchedCourses++;
                              break;
                            }
                          }
                        }
                      }
                      return {
                        ...template,
                        matchedCourses,
                        totalCourses: template.courses.length,
                        matchPercent: Math.round((matchedCourses / template.courses.length) * 100)
                      };
                    });
                    
                    // Sort by matched courses (descending), filter to only show those with matches if transcript exists
                    const sortedTemplates = templateMatches
                      .sort((a, b) => b.matchedCourses - a.matchedCourses);
                    
                    const recommendedTemplates = transcriptData 
                      ? sortedTemplates.filter(t => t.matchedCourses > 0)
                      : sortedTemplates;
                    
                    const otherTemplates = transcriptData
                      ? sortedTemplates.filter(t => t.matchedCourses === 0)
                      : [];
                    
                    return (
                      <>
                        {/* Recommended Templates (based on transcript) */}
                        {transcriptData && recommendedTemplates.length > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-green-800 mb-2">
                              📊 Recommended for You (based on your courses):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {recommendedTemplates.map(template => (
                                <button
                                  key={template.id}
                                  onClick={() => {
                                    setCustomMajorName(template.name);
                                    setCustomMajorCourses(template.courses);
                                    setCustomMajorElectives(template.electives);
                                  }}
                                  className="px-3 py-2 bg-white border border-green-300 rounded-lg text-sm text-green-800 hover:bg-green-100 transition-colors text-left"
                                >
                                  <div className="font-medium">{template.name}</div>
                                  <div className="text-xs text-green-600">
                                    {template.matchedCourses} of {template.totalCourses} courses done ({template.matchPercent}%)
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Other Templates / All Templates if no transcript */}
                        {(otherTemplates.length > 0 || !transcriptData) && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-blue-800 mb-2">
                              {transcriptData ? '📋 Other Joint/Double Major Templates:' : '📋 Quick Start Templates:'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {(transcriptData ? otherTemplates : sortedTemplates).map(template => (
                                <button
                                  key={template.id}
                                  onClick={() => {
                                    setCustomMajorName(template.name);
                                    setCustomMajorCourses(template.courses);
                                    setCustomMajorElectives(template.electives);
                                  }}
                                  className="px-3 py-1 bg-white border border-blue-300 rounded-full text-sm text-blue-700 hover:bg-blue-100 transition-colors"
                                >
                                  {template.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Prompt to upload transcript if not done */}
                        {!transcriptData && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-yellow-800 text-sm">
                              💡 Upload your transcript in the first tab to see personalized recommendations!
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Upload Requirements Sheet */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      id="customMajorUpload"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        setParsingCustomImage(true);
                        setCustomMajorError('');
                        
                        try {
                          // Convert file to base64
                          const base64 = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result.split(',')[1]);
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                          });
                          
                          // Determine media type and content type for API
                          const mediaType = file.type || 'image/png';
                          const isPDF = mediaType === 'application/pdf';
                          
                          // Build the content based on file type
                          const fileContent = isPDF 
                            ? {
                                type: 'document',
                                source: { type: 'base64', media_type: 'application/pdf', data: base64 }
                              }
                            : {
                                type: 'image',
                                source: { type: 'base64', media_type: mediaType, data: base64 }
                              };
                          
                          // Call Anthropic API to parse the file
                          const response = await fetch('https://api.anthropic.com/v1/messages', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              model: 'claude-sonnet-4-20250514',
                              max_tokens: 2000,
                              messages: [{
                                role: 'user',
                                content: [
                                  fileContent,
                                  {
                                    type: 'text',
                                    text: `Extract ALL course requirements from this major/degree checklist. Return ONLY a JSON object with this exact format, no other text or markdown:
{
  "majorName": "Name of the major/program",
  "courses": [
    {"code": "DEPT 123", "name": "Course Name", "credits": 3}
  ],
  "electivesRequired": 0,
  "electivesDescription": "Description of electives if any"
}

Important instructions:
- Look for ALL course codes (like MATH 111, ECON 101, HLTH 250, etc.) and their full names
- Include courses from ALL sections (Foundation, Research Methods, Policy courses, Ethics courses, Capstone, etc.)
- For "choose X from list" requirements, include all options but note in the name if it's an "OR" choice
- Extract the number of electives required and describe what qualifies
- Credits are usually shown in parentheses like (3) or (4)
- Include prerequisite courses if they are required for the major`
                                  }
                                ]
                              }]
                            })
                          });
                          
                          const data = await response.json();
                          const text = data.content?.map(c => c.text || '').join('') || '';
                          
                          // Parse the JSON response
                          const jsonMatch = text.match(/\{[\s\S]*\}/);
                          if (jsonMatch) {
                            const parsed = JSON.parse(jsonMatch[0]);
                            
                            if (parsed.courses && parsed.courses.length > 0) {
                              setCustomMajorName(parsed.majorName || 'Custom Major');
                              setCustomMajorCourses(parsed.courses.map(c => ({
                                code: c.code,
                                name: c.name,
                                credits: c.credits || 3
                              })));
                              setCustomMajorElectives({
                                required: parsed.electivesRequired || 0,
                                description: parsed.electivesDescription || ''
                              });
                            } else {
                              setCustomMajorError('Could not find any courses in the document. Please try a clearer image or enter courses manually below.');
                            }
                          } else {
                            setCustomMajorError('Could not parse the requirements. Please try a clearer image or enter courses manually below.');
                          }
                        } catch (err) {
                          console.error('Error parsing file:', err);
                          setCustomMajorError('Error processing file. Please try again or enter courses manually below.');
                        } finally {
                          setParsingCustomImage(false);
                        }
                      }}
                    />
                    <label htmlFor="customMajorUpload" className="cursor-pointer block">
                      {parsingCustomImage ? (
                        <>
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-3"></div>
                          <p className="text-gray-600 font-medium">Analyzing your requirements sheet...</p>
                          <p className="text-sm text-gray-400 mt-1">This may take a few seconds</p>
                        </>
                      ) : (
                        <>
                          <div className="text-4xl mb-3">📄</div>
                          <p className="text-gray-700 font-medium">Upload Your Requirements Sheet</p>
                          <p className="text-sm text-gray-500 mt-1">Screenshot or PDF of your major checklist</p>
                          <p className="text-xs text-gray-400 mt-2">We'll automatically extract the courses</p>
                        </>
                      )}
                    </label>
                  </div>

                  {customMajorError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                      {customMajorError}
                    </div>
                  )}

                  {/* Manual Entry Form */}
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-800 mb-3">Or enter courses manually:</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Major/Program Name
                        </label>
                        <input
                          type="text"
                          value={customMajorName}
                          onChange={(e) => setCustomMajorName(e.target.value)}
                          placeholder="e.g., BBA + QSS Secondary Major"
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Core Courses <span className="text-gray-400 font-normal">(one per line: DEPT 123 Course Name)</span>
                        </label>
                        <textarea
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          rows={6}
                          placeholder="MATH 111 Calculus I
QTM 110 Introduction to Scientific Methods
MATH 210 Advanced Calculus for Data Sciences"
                          id="customCoursesInput"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Electives Required
                          </label>
                          <input
                            type="number"
                            min="0"
                            defaultValue="0"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            id="customElectivesCount"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Electives Description
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., 300+ level courses"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            id="customElectivesDesc"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const coursesText = document.getElementById('customCoursesInput')?.value || '';
                          const electivesCount = parseInt(document.getElementById('customElectivesCount')?.value) || 0;
                          const electivesDesc = document.getElementById('customElectivesDesc')?.value || '';
                          
                          if (!customMajorName.trim()) {
                            setCustomMajorError('Please enter a name for your major/program.');
                            return;
                          }
                          
                          // Parse courses from text
                          const courses = [];
                          const lines = coursesText.split('\n');
                          for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed) continue;
                            
                            const match = trimmed.match(/^([A-Z]+)\s*(\d+[A-Z]?W?)\s+(.+)$/i);
                            if (match) {
                              const [_, dept, num, name] = match;
                              courses.push({
                                code: `${dept.toUpperCase()} ${num.toUpperCase()}`,
                                name: name.trim(),
                                credits: 3
                              });
                            }
                          }
                          
                          if (courses.length === 0) {
                            setCustomMajorError('Please enter at least one course. Format: DEPT 123 Course Name');
                            return;
                          }
                          
                          setCustomMajorError('');
                          setCustomMajorCourses(courses);
                          setCustomMajorElectives({
                            required: electivesCount,
                            description: electivesDesc
                          });
                        }}
                        className="w-full py-3 rounded-lg text-white font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: '#004990' }}
                      >
                        Create Tracker
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Custom Major Progress Display */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold" style={{ color: '#004990' }}>
                      {customMajorName}
                    </h3>
                    <button
                      onClick={() => {
                        setCustomMajorCourses([]);
                        setCustomMajorName('');
                        setCustomMajorElectives({ required: 0, description: '' });
                        setCustomMajorError('');
                      }}
                      className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <span>✕</span> Clear & Start Over
                    </button>
                  </div>

                  {!transcriptData && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        💡 Upload your transcript in the "Upload Transcript" tab to see which requirements you've completed!
                      </p>
                    </div>
                  )}

                  {/* Progress calculation for custom major */}
                  {(() => {
                    const completedCourses = [];
                    const remainingCourses = [];
                    
                    for (const course of customMajorCourses) {
                      let isCompleted = false;
                      let matchedTranscript = null;
                      
                      if (transcriptData) {
                        for (const tc of transcriptData.courses) {
                          if (coursesSatisfyRequirement(tc.code, course.code) && tc.credits > 0 && !tc.noCredit) {
                            isCompleted = true;
                            matchedTranscript = tc;
                            break;
                          }
                        }
                      }
                      
                      if (isCompleted) {
                        completedCourses.push({ ...course, transcriptMatch: matchedTranscript });
                      } else {
                        remainingCourses.push(course);
                      }
                    }
                    
                    const progressPercent = Math.round((completedCourses.length / customMajorCourses.length) * 100);
                    
                    return (
                      <>
                        <ProgressBar
                          percent={progressPercent}
                          label={`Core Progress: ${completedCourses.length} of ${customMajorCourses.length} courses`}
                        />
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Completed */}
                          <div>
                            <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-sm">✓</span>
                              Completed ({completedCourses.length})
                            </h4>
                            <div className="space-y-2">
                              {completedCourses.map((course, i) => (
                                <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200">
                                  <div className="font-medium text-green-800">{course.code}</div>
                                  <div className="text-sm text-green-600">{course.name}</div>
                                  {course.transcriptMatch && (
                                    <div className="text-xs text-green-500 mt-1">
                                      Grade: {course.transcriptMatch.grade}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {completedCourses.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No courses completed yet</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Remaining */}
                          <div>
                            <h4 className="font-bold text-orange-700 mb-3 flex items-center gap-2">
                              <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-sm">!</span>
                              Remaining ({remainingCourses.length})
                            </h4>
                            <div className="space-y-2">
                              {remainingCourses.map((course, i) => (
                                <div key={i} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                  <div className="font-medium text-orange-800">{course.code}</div>
                                  <div className="text-sm text-orange-600">{course.name}</div>
                                </div>
                              ))}
                              {remainingCourses.length === 0 && (
                                <p className="text-sm text-green-600 font-medium">🎉 All core courses completed!</p>
                              )}
                            </div>
                            
                            {/* Electives */}
                            {customMajorElectives.required > 0 && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="font-medium text-blue-800">+ Electives Required</div>
                                <div className="text-sm text-blue-600">
                                  {customMajorElectives.required} courses
                                </div>
                                {customMajorElectives.description && (
                                  <div className="text-xs text-blue-500 mt-1">
                                    {customMajorElectives.description}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* GER Tab */}
        {activeTab === 'ger' && (
          <div className="space-y-6">
            {!transcriptData ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800">Please upload your transcript first</p>
              </div>
            ) : gerProgress && (
              <>
                {/* Overall GER Progress */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4" style={{ color: '#004990', fontFamily: "'Crimson Pro', serif" }}>
                    General Education Requirements (GER)
                  </h2>
                  <ProgressBar
                    percent={gerProgress.progressPercent}
                    label={`Overall: ${gerProgress.totalCompleted} / ${gerProgress.totalRequired} requirements`}
                    sublabel="Complete all requirements before graduation"
                  />
                </div>

                {/* GER Categories */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-bold mb-4" style={{ color: '#004990', fontFamily: "'Crimson Pro', serif" }}>Requirement Breakdown</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(gerProgress.categories).map(([category, data]) => {
                      const isComplete = data.completed >= data.required;
                      return (
                        <div
                          key={category}
                          className={`p-4 rounded-lg border-2 ${
                            isComplete ? 'border-green-200 bg-green-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{category}</span>
                            <span className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                              {data.completed}/{data.required}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">Due: {data.description}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${isComplete ? 'bg-green-500' : 'bg-orange-400'}`}
                              style={{ width: `${Math.min((data.completed / data.required) * 100, 100)}%` }}
                            />
                          </div>
                          {data.courses.length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              {data.courses.map(c => c.code).join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* GER Timeline */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-bold mb-4" style={{ color: '#004990', fontFamily: "'Crimson Pro', serif" }}>GER Timeline</h3>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                    {[
                      { phase: '1st Semester', items: ['Discovery Seminar'], color: '#004990' },
                      { phase: '1st Year', items: ['First-Year Writing', 'PE'], color: '#c9a227' },
                      { phase: 'Oxford Graduation', items: ['HA', 'NS', 'QR', 'SS', 'E'], color: '#004990' },
                      { phase: 'Year 3', items: ['Intercultural (2)', 'Race & Ethnicity'], color: '#c9a227' },
                      { phase: 'Graduation', items: ['Continued Communication / W (2)'], color: '#004990' }
                    ].map((milestone, i) => (
                      <div key={i} className="relative pl-10 pb-6">
                        <div
                          className="absolute left-2 w-4 h-4 rounded-full border-2 bg-white"
                          style={{ borderColor: milestone.color }}
                        />
                        <div className="font-bold" style={{ color: milestone.color }}>{milestone.phase}</div>
                        <div className="text-sm text-gray-600">{milestone.items.join(' • ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm border-t">
        <p style={{ fontWeight: '500' }}>Emory Major Planner</p>
        <p className="mt-1 italic">For those who seek knowledge.</p>
        <p className="mt-1">Built by Timothy Chen, Emory Class of 2028.</p>
      </footer>
    </div>
  );
}
