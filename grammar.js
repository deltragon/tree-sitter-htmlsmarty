const html = require("tree-sitter-html/grammar");

// taken from tree-sitter-php
const PREC = {
  COMMA: -1,
  CAST: -1,
  LOGICAL_OR_2: 1,
  LOGICAL_XOR: 2,
  LOGICAL_AND_2: 3,
  ASSIGNMENT: 4,
  TERNARY: 5,
  NULL_COALESCE: 6,
  LOGICAL_OR_1: 7,
  LOGICAL_AND_1: 8,
  BITWISE_OR: 9,
  BITWISE_XOR: 10,
  BITWISE_AND: 11,
  EQUALITY: 12,
  INEQUALITY: 13,
  SHIFT: 14,
  PLUS: 15,
  TIMES: 16,
  NEG: 17,
  INSTANCEOF: 18,
  INC: 19,
  SCOPE: 20,
  NEW: 21,
  CALL: 22,
  MEMBER: 23,
  DEREF: 24
};

module.exports = grammar(html, {
  name: "htmlsmarty",

  extras: $ => [
    $.comment,
    // TODO: technically this would be possible too, and a whole lot easier (only needs adjusting text, nothing else)
    // but i dont know if this would then properly work with indentation for eg. smarty_if
    //$.smarty_comment,
    /\s+/,
  ],

  rules: {
    smarty_comment: ($) => seq(
      "{*",
      /[^*]*\*+([^}*][^*]*\*+)*/,
      "}"
    ),

    _smarty_expression: ($) => choice(
      $._smarty_primary_expression,
      $.smarty_binary_expression,
      $.smarty_unary_op_expression,
    ),

    _smarty_primary_expression: $ => choice(
      $._smarty_variable,
      $._smarty_literal,
    ),

    // taken from tree-sitter-php
    smarty_binary_expression: $ => choice(
      ...[
        [alias(/and|AND/, 'and'), PREC.LOGICAL_AND_2],
        [alias(/or|OR/, 'or'), PREC.LOGICAL_OR_2],
        [alias(/xor|XOR/, 'xor'), PREC.LOGICAL_XOR],
        ['||', PREC.LOGICAL_OR_1],
        ['&&', PREC.LOGICAL_AND_1],
        //['|', PREC.BITWISE_OR], // no bitwise or, used for pipes
        ['^', PREC.BITWISE_XOR],
        ['&', PREC.BITWISE_AND],
        ['==', PREC.EQUALITY],
        ['!=', PREC.EQUALITY],
        ['<>', PREC.EQUALITY],
        ['===', PREC.EQUALITY],
        ['!==', PREC.EQUALITY],
        ['<', PREC.INEQUALITY],
        ['>', PREC.INEQUALITY],
        ['<=', PREC.INEQUALITY],
        ['>=', PREC.INEQUALITY],
        //['<=>', PREC.EQUALITY], // no spaceship operator
        //['<<', PREC.SHIFT], // no shift
        //['>>', PREC.SHIFT], // no shift
        ['+', PREC.PLUS],
        ['-', PREC.PLUS],
        //['.', PREC.PLUS], // no concatenation, used for member access
        ['*', PREC.TIMES],
        ['/', PREC.TIMES],
        ['%', PREC.TIMES],
      ].map(([op, p]) => prec.left(p, seq(
        field('left', $._smarty_expression),
        field('operator', op),
        field('right', $._smarty_expression)
      )))
    ),

    smarty_unary_op_expression: $ => prec.left(PREC.NEG, seq(
      choice(
        '+',
        '-',
        //'~', // no bitwise negation
        '!'
      ),
      $._smarty_expression
    )),

    _smarty_variable: ($) => choice(
      $.smarty_variable_name,
      $.smarty_member_access_expression,
    ),

    _smarty_literal: ($) => choice(
      $.smarty_string,
    ),

    smarty_member_access_expression: ($) => seq(
      $._smarty_variable,
      '.',
      $._smarty_member_name,
    ),

    _smarty_member_name: ($) => field('name', $.smarty_name),

    smarty_interpolation: ($) => seq(
      '{',
      $._smarty_expression,
      '}'
    ),

    smarty_assignment: ($) => seq(
      '{',
      field('left', $._smarty_variable),
      "=",
      field('right', $._smarty_expression),
      '}'
    ),

    smarty_string: $ => token(choice(
      seq(
        "'",
        repeat(/\\'|\\\\|\\?[^'\\]/),
        "'"
      ),
      seq(
        '"',
        repeat(/\\"|\\\\|\\?[^"\\]/),
        '"'
      )
    )),

    smarty_variable_name: $ => seq('$', $.smarty_name),

    smarty_name: $ => /[_a-zA-Z\u00A1-\u00ff][_a-zA-Z\u00A1-\u00ff\d]*/,

    _smarty_if_condition: ($) => choice(
      $._smarty_expression,
    ),

    smarty_if_nodes: ($) => seq(
      // TODO: this currently highlights the entire "{if", not just the "if"
      // getting too many conflicts if i try, so just to be sure
      alias("{if", "if"),
      field('condition', $._smarty_if_condition),
      "}",
      field('body', repeat($._node)),
      repeat(field('alternative', $.smarty_elseif_nodes)),
      optional(field('alternative', $.smarty_else_nodes)),
      "{/",
      keyword("if"),
      "}"
    ),

    smarty_elseif_nodes: $ => seq(
      // TODO: this currently highlights the entire "{elseif", not just the "elseif"
      // it gives me a conflict if i try
      alias("{elseif", "elseif"),
      field('condition', $._smarty_if_condition),
      "}",
      field('body', repeat($._node)),
    ),

    smarty_else_nodes: $ => seq(
      // TODO: this currently highlights the entire "{else", not just the "else"
      // it gives me a conflict if i try
      alias("{else", "else"),
      "}",
      field('body', repeat($._node)),
    ),

    smarty_if_attributes: ($) => seq(
      // TODO: this currently highlights the entire "{if", not just the "if"
      // for some reason, this works above, but not here
      alias("{if", "if"),
      //"{",
      //keyword("if"),
      field('condition', $._smarty_if_condition),
      "}",
      field('body', repeat($._attribute)),
      repeat(field('alternative', $.smarty_elseif_attributes)),
      optional(field('alternative', $.smarty_else_attributes)),
      "{/",
      keyword("if"),
      "}"
    ),

    smarty_elseif_attributes: $ => seq(
      // TODO: this currently highlights the entire "{elseif", not just the "elseif"
      // it gives me a conflict if i try
      alias("{elseif", "elseif"),
      field('condition', $._smarty_if_condition),
      "}",
      field('body', repeat($._attribute)),
    ),

    smarty_else_attributes: $ => seq(
      // TODO: this currently highlights the entire "{else}", not just the "else"
      // it gives me a conflict if i try
      // or the else just gets eaten as an html attribute
      alias("{else}", "else"),
      field('body', repeat($._attribute)),
    ),

    smarty_foreach_header: $ => choice(
      seq(
        $._smarty_expression,
        keyword("as"),
        $.smarty_variable_name
      ),
    ),

    smarty_foreach_nodes: ($) => seq(
      "{",
      keyword("foreach"),
      $.smarty_foreach_header,
      "}",
      repeat($._node),
      "{/",
      keyword("foreach"),
      "}"
    ),

    // in text
    // FIXME: see comment in test/corpus/unpaired.txt for why this is broken in the edge case of
    // `text {<valid-tag/>`
    text: $ => /([^<>{])+/,

    _node: $ => choice(
      $.doctype,
      $.text,
      $.smarty_comment,
      $.smarty_if_nodes,
      $.smarty_foreach_nodes,
      $.smarty_interpolation,
      $.smarty_assignment,
      $.element,
      $.script_element,
      $.style_element,
      $.erroneous_end_tag,
    ),

    // in attribute lists
    _attribute: $ => choice(
      $.attribute,
      $.smarty_comment,
      $.smarty_if_attributes,
    ),

    attribute_name: $ => /[^<>"'/=\s{]+/, // disallow { in attribute names
    
    // this is necessary as otherwise we get errors 
    attribute_value: $ => /[^<>"'=\s{]+/, // disallow { in unqoted attribute values

    sq_attribute_value_fragment: $ => repeat1(choice(
      /([^'{]|\{[^*'])+/,
      $.smarty_comment
    )),
    dq_attribute_value_fragment: $ => repeat1(choice(
      /([^"{]|\{[^*"])+/,
      $.smarty_comment
    )),

    quoted_attribute_value: $ => choice(
      seq("'", optional(alias($.sq_attribute_value_fragment, $.attribute_value)), optional("{"), "'"),
      seq('"', optional(alias($.dq_attribute_value_fragment, $.attribute_value)), optional("{"), '"'),
    ),


    start_tag: $ => seq(
      '<',
      alias($._start_tag_name, $.tag_name),
      repeat($._attribute),
      '>'
    ),

    script_start_tag: $ => seq(
      '<',
      alias($._script_start_tag_name, $.tag_name),
      repeat($._attribute),
      '>'
    ),

    style_start_tag: $ => seq(
      '<',
      alias($._style_start_tag_name, $.tag_name),
      repeat($._attribute),
      '>'
    ),

    self_closing_tag: $ => seq(
      '<',
      alias($._start_tag_name, $.tag_name),
      repeat($._attribute),
      '/>'
    ),
  }
});

// taken from tree-sitter-php
function keyword(word, aliasAsWord = true) {
  let pattern = ''
  for (const letter of word) {
    pattern += `[${letter}${letter.toLocaleUpperCase()}]`
  }
  let result = new RegExp(pattern)
  if (aliasAsWord) result = alias(result, word)
  return result
}
