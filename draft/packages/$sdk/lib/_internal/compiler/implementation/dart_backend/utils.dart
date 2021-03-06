// Copyright (c) 2012, the Dart project authors.  Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// BSD-style license that can be found in the LICENSE file.

part of dart_backend;

class CloningVisitor implements Visitor<Node> {
  final TreeElements originalTreeElements;
  final TreeElementMapping cloneTreeElements;

  CloningVisitor(originalTreeElements)
      : cloneTreeElements =
            new TreeElementMapping(originalTreeElements.currentElement),
        this.originalTreeElements = originalTreeElements;

  visit(Node node) {
    if (node == null) return null;
    final clone = node.accept(this);

    final originalElement = originalTreeElements[node];
    if (originalElement != null) cloneTreeElements[clone] = originalElement;

    final originalType = originalTreeElements.getType(node);
    if (originalType != null) cloneTreeElements.setType(clone, originalType);
    return clone;
  }

  Node visitBlock(Block node) => new Block(visit(node.statements));

  Node visitBreakStatement(BreakStatement node) => new BreakStatement(
      visit(node.target), node.keywordToken, node.semicolonToken);

  Node visitCascade(Cascade node) => new Cascade(visit(node.expression));

  Node visitCascadeReceiver(CascadeReceiver node) => new CascadeReceiver(
      visit(node.expression), node.cascadeOperator);

  Node visitCaseMatch(CaseMatch node) => new CaseMatch(
      node.caseKeyword, visit(node.expression), node.colonToken);

  Node visitCatchBlock(CatchBlock node) => new CatchBlock(
      visit(node.type), visit(node.formals), visit(node.block),
      node.onKeyword, node.catchKeyword);

  Node visitClassNode(ClassNode node) => new ClassNode(
      visit(node.modifiers), visit(node.name), visit(node.typeParameters),
      visit(node.superclass), visit(node.interfaces),
      node.beginToken, node.extendsKeyword, visit(node.body), node.endToken);

  Node visitConditional(Conditional node) => new Conditional(
      visit(node.condition), visit(node.thenExpression),
      visit(node.elseExpression), node.questionToken, node.colonToken);

  Node visitContinueStatement(ContinueStatement node) => new ContinueStatement(
      visit(node.target), node.keywordToken, node.semicolonToken);

  Node visitDoWhile(DoWhile node) => new DoWhile(
      visit(node.body), visit(node.condition),
      node.doKeyword, node.whileKeyword, node.endToken);

  Node visitEmptyStatement(EmptyStatement node) => new EmptyStatement(
      node.semicolonToken);

  Node visitExpressionStatement(ExpressionStatement node) => new ExpressionStatement(
      visit(node.expression), node.endToken);

  Node visitFor(For node) => new For(
      visit(node.initializer), visit(node.conditionStatement),
      visit(node.update), visit(node.body), node.forToken);

  Node visitForIn(ForIn node) => new ForIn(
      visit(node.declaredIdentifier), visit(node.expression), visit(node.body),
      node.forToken, node.inToken);

  Node visitFunctionDeclaration(FunctionDeclaration node) => new FunctionDeclaration(
      visit(node.function));

  Node rewriteFunctionExpression(FunctionExpression node, Statement body) =>
      new FunctionExpression(
          visit(node.name), visit(node.parameters), body,
          visit(node.returnType), visit(node.modifiers),
          visit(node.initializers), node.getOrSet);

  Node visitFunctionExpression(FunctionExpression node) =>
      rewriteFunctionExpression(node, visit(node.body));

  Node visitIdentifier(Identifier node) => new Identifier(node.token);

  Node visitIf(If node) => new If(
      visit(node.condition), visit(node.thenPart), visit(node.elsePart),
      node.ifToken, node.elseToken);

  Node visitLabel(Label node) =>
      new Label(visit(node.identifier), node.colonToken);

  Node visitLabeledStatement(LabeledStatement node) => new LabeledStatement(
      visit(node.labels), visit(node.statement));

  Node visitLiteralBool(LiteralBool node) => new LiteralBool(
      node.token, node.handler);

  Node visitLiteralDouble(LiteralDouble node) => new LiteralDouble(
      node.token, node.handler);

  Node visitLiteralInt(LiteralInt node) =>
      new LiteralInt(node.token, node.handler);

  Node visitLiteralList(LiteralList node) => new LiteralList(
      visit(node.typeArguments), visit(node.elements), node.constKeyword);

  Node visitLiteralMap(LiteralMap node) => new LiteralMap(
      visit(node.typeArguments), visit(node.entries), node.constKeyword);

  Node visitLiteralMapEntry(LiteralMapEntry node) => new LiteralMapEntry(
      visit(node.key), node.colonToken, visit(node.value));

  Node visitLiteralNull(LiteralNull node) => new LiteralNull(node.token);

  Node visitLiteralString(LiteralString node) => new LiteralString(
      node.token, node.dartString);

  Node visitMetadata(Metadata node) => new Metadata(
      node.token, visit(node.expression));

  Node visitMixinApplication(MixinApplication node) => new MixinApplication(
      visit(node.superclass), visit(node.mixins));

  Node visitNamedMixinApplication(NamedMixinApplication node) =>
      new NamedMixinApplication(visit(node.name),
                                visit(node.typeParameters),
                                visit(node.modifiers),
                                visit(node.mixinApplication),
                                visit(node.interfaces),
                                node.classKeyword,
                                node.endToken);

  Node visitModifiers(Modifiers node) => new Modifiers(visit(node.nodes));

  Node visitNamedArgument(NamedArgument node) => new NamedArgument(
      visit(node.name), node.colonToken, visit(node.expression));

  Node visitNewExpression(NewExpression node) => new NewExpression(
      node.newToken, visit(node.send));

  Node rewriteNodeList(NodeList node, Link link) =>
      new NodeList(node.beginToken, link, node.endToken, node.delimiter);

  Node visitNodeList(NodeList node) {
    // Special case for classes which exist in hierarchy, but not
    // in the visitor.
    if (node is Prefix) {
      return node.nodes.isEmpty ?
          new Prefix() : new Prefix.singleton(visit(node.nodes.head));
    }
    if (node is Postfix) {
      return node.nodes.isEmpty ?
          new Postfix() : new Postfix.singleton(visit(node.nodes.head));
    }
    LinkBuilder<Node> builder = new LinkBuilder<Node>();
    for (Node n in node.nodes) {
      builder.addLast(visit(n));
    }
    return rewriteNodeList(node, builder.toLink());
  }

  Node visitOperator(Operator node) => new Operator(node.token);

  Node visitParenthesizedExpression(ParenthesizedExpression node) =>
      new ParenthesizedExpression(visit(node.expression), node.beginToken);

  Node visitRethrow(Rethrow node) => new Rethrow(
      node.throwToken, node.endToken);

  Node visitReturn(Return node) => new Return(
      node.beginToken, node.endToken, visit(node.expression));

  Node visitSend(Send node) => new Send(
      visit(node.receiver), visit(node.selector), visit(node.argumentsNode));

  Node visitSendSet(SendSet node) => new SendSet(
      visit(node.receiver), visit(node.selector),
      visit(node.assignmentOperator), visit(node.argumentsNode));

  Node visitStringInterpolation(StringInterpolation node) =>
      new StringInterpolation(visit(node.string), visit(node.parts));

  Node visitStringInterpolationPart(StringInterpolationPart node) =>
      new StringInterpolationPart(visit(node.expression), visit(node.string));

  Node visitStringJuxtaposition(StringJuxtaposition node) =>
      new StringJuxtaposition(visit(node.first), visit(node.second));

  Node visitSwitchCase(SwitchCase node) => new SwitchCase(
      visit(node.labelsAndCases), node.defaultKeyword, visit(node.statements),
      node.startToken);

  Node visitSwitchStatement(SwitchStatement node) => new SwitchStatement(
      visit(node.parenthesizedExpression), visit(node.cases),
      node.switchKeyword);

  Node visitLiteralSymbol(LiteralSymbol node) => new LiteralSymbol(
      node.hashToken, visit(node.identifiers));

  Node visitThrow(Throw node) => new Throw(
      visit(node.expression), node.throwToken, node.endToken);

  Node visitTryStatement(TryStatement node) => new TryStatement(
      visit(node.tryBlock), visit(node.catchBlocks), visit(node.finallyBlock),
      node.tryKeyword, node.finallyKeyword);

  Node visitTypeAnnotation(TypeAnnotation node) => new TypeAnnotation(
      visit(node.typeName), visit(node.typeArguments));

  Node visitTypedef(Typedef node) => new Typedef(
      visit(node.returnType), visit(node.name), visit(node.typeParameters),
      visit(node.formals), node.typedefKeyword, node.endToken);

  Node visitTypeVariable(TypeVariable node) => new TypeVariable(
      visit(node.name), visit(node.bound));

  Node visitVariableDefinitions(VariableDefinitions node) =>
      new VariableDefinitions.forParameter(
          visit(node.metadata), visit(node.type),
          visit(node.modifiers), visit(node.definitions));

  Node visitWhile(While node) => new While(
      visit(node.condition), visit(node.body), node.whileKeyword);

  Node visitNode(Node node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitCombinator(Combinator node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitExport(Export node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitExpression(Expression node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitGotoStatement(GotoStatement node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitImport(Import node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitLibraryDependency(LibraryTag node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitLibraryName(LibraryName node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitLibraryTag(LibraryTag node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitLiteral(Literal node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitLoop(Loop node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitPart(Part node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitPartOf(PartOf node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitPostfix(Postfix node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitPrefix(Prefix node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitStatement(Statement node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  Node visitStringNode(StringNode node) {
    unimplemented('visitNode', node: node);
    return null;
  }

  unimplemented(String message, {Node node}) {
    throw message;
  }
}
